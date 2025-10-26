import * as XLSX from "xlsx";
import openai from "./openai";

export interface ParsedProgram {
  programName: string;
  description?: string;
  phases: ParsedPhase[];
}

export interface ParsedPhase {
  phaseName: string;
  phaseNumber: number;
  description?: string;
  workoutDays: ParsedWorkoutDay[];
}

export interface ParsedWorkoutDay {
  dayName: string;
  dayNumber: number;
  isRestDay: boolean;
  weekNumber?: number;
  exercises: ParsedExercise[];
}

export interface ParsedExercise {
  exerciseName: string;
  warmupSets: number;
  workingSets: number;
  reps: string;
  load?: string;
  rpe?: string;
  restTimer?: string;
  substitutionOption1?: string;
  substitutionOption2?: string;
  notes?: string;
  supersetGroup?: string;
  exerciseOrder: number;
}

export async function parseProgramSpreadsheet(
  buffer: Buffer,
  filename: string
): Promise<ParsedProgram> {
  // Extract all sheets from Excel file
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  // Extract program name from filename
  const programName = filename.replace(/\.(xlsx|xls|csv)$/i, '').replace(/_/g, ' ');
  
  console.log(`Starting parallel processing of ${workbook.SheetNames.length} sheets...`);
  
  // Process all sheets in parallel for maximum speed
  const phasePromises = workbook.SheetNames.map((sheetName, i) => {
    const sheet = workbook.Sheets[sheetName];
    const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
    
    console.log(`Processing sheet ${i + 1}/${workbook.SheetNames.length}: ${sheetName}`);
    
    // Use OpenAI to parse this phase
    return parsePhaseWithOpenAI(sheetName, sheetData, i + 1);
  });
  
  // Wait for all sheets to be processed in parallel
  const phases = await Promise.all(phasePromises);
  
  console.log(`Completed all ${phases.length} sheets in parallel`);
  phases.forEach((phase, i) => {
    console.log(`  Sheet ${i + 1}: Found ${phase.workoutDays.length} workout days`);
  });
  
  return {
    programName,
    phases,
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function parsePhaseWithOpenAI(
  sheetName: string,
  sheetData: any[][],
  phaseNumber: number
): Promise<ParsedPhase> {
  // Limit the amount of data sent to OpenAI - take first 100 rows
  const limitedData = sheetData.slice(0, 100);
  
  // Retry logic for rate limits
  let retries = 0;
  const maxRetries = 3;
  let lastError: Error | null = null;
  let parsed: any = null;
  
  while (retries < maxRetries) {
    try {
      console.log(`Calling OpenAI for sheet "${sheetName}" (attempt ${retries + 1}/${maxRetries})...`);
      const completion = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: `You are an expert fitness coach analyzing workout program spreadsheets. Parse this workout phase and extract its structure.

Your task:
1. Extract the phase name and description from the sheet
2. Identify all workout days (e.g., "Push #1", "Pull #1", "Legs #1", etc.)
3. For each workout day, extract all exercises with their details
4. Recognize supersets (marked with A1/A2 or B1/B2 prefixes in exercise names)
5. Add 1-2 rest days to complete a weekly schedule (PPL programs typically have 5-6 training days + 1-2 rest days)

IMPORTANT PARSING RULES:
- Column headers usually include: "Exercise", "Warm-up Sets", "Working Sets", "Reps", "Load", "RPE", "Rest", "Substitution Option"
- Each row with a new day name (like "Push #1", "Pull #1") starts a new workout day
- Exercises under a day belong to that workout day until the next day starts
- If an exercise name starts with "A1.", "A2.", "B1.", etc., extract that as the supersetGroup
- For reps, keep as string (e.g., "8-10", "10+5", "30s HOLD")
- For RPE, keep as string (can be number, "See Notes", or "N/A")
- For rest timer, keep as string (e.g., "~3-4 min", "0 min", "~1-2 min")
- Give each exercise an exerciseOrder number (1, 2, 3, etc.) within its workout day

CRITICAL VALUE RANGES - DO NOT USE VALUES OUTSIDE THESE RANGES:
- warmupSets: MUST be between 0-5 (typically 0-3). NEVER use large numbers like 44624!
- workingSets: MUST be between 1-10 (typically 1-5)
- rpe: MUST be between 1-10 or special values like "See Notes", "N/A". NEVER use numbers above 10 or large numbers like 44782!
- If you see date serial numbers (like 44624, 44782) in cells, these are Excel date formatting errors - ignore them and use reasonable workout values instead

Return a JSON object:
{
  "phaseName": "Phase 1 - Base Hypertrophy",
  "description": "Moderate Volume, Moderate Intensity",
  "workoutDays": [
    {
      "dayName": "Push #1",
      "dayNumber": 1,
      "isRestDay": false,
      "weekNumber": 1,
      "exercises": [
        {
          "exerciseName": "Bench Press",
          "warmupSets": 2,
          "workingSets": 3,
          "reps": "8-10",
          "load": null,
          "rpe": "8",
          "restTimer": "~3-4 min",
          "substitutionOption1": "DB Bench Press",
          "substitutionOption2": "Machine Chest Press",
          "notes": "Keep shoulder blades retracted",
          "supersetGroup": null,
          "exerciseOrder": 1
        }
      ]
    },
    {
      "dayName": "REST",
      "dayNumber": 7,
      "isRestDay": true,
      "weekNumber": 1,
      "exercises": []
    }
  ]
}`,
      },
      {
        role: "user",
        content: `Parse this workout phase. Sheet name: "${sheetName}"

First 100 rows of sheet data:
${JSON.stringify(limitedData, null, 2)}

Return the parsed phase structure as JSON. Include suggested rest days to complete a 7-day week.`,
      },
    ],
    response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      console.log(`OpenAI response received for sheet "${sheetName}" (${content.length} chars)`);
      parsed = JSON.parse(content);
      console.log(`Successfully parsed ${parsed.workoutDays?.length || 0} workout days from sheet "${sheetName}"`);
      
      // Success! Exit the retry loop
      break;
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error
      if (error?.status === 429 && retries < maxRetries - 1) {
        retries++;
        const waitTime = Math.pow(2, retries) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(`Rate limit hit on sheet "${sheetName}". Retrying in ${waitTime/1000}s... (attempt ${retries}/${maxRetries})`);
        await sleep(waitTime);
        continue;
      }
      
      // Not a rate limit or out of retries
      throw error;
    }
  }
  
  if (!parsed) {
    throw lastError || new Error("Failed to parse sheet after retries");
  }
  
  // Ensure we have valid data
  if (!parsed.workoutDays || !Array.isArray(parsed.workoutDays)) {
    console.warn(`No workout days found in sheet: ${sheetName}`);
    return {
      phaseName: sheetName,
      phaseNumber,
      description: parsed.description || null,
      workoutDays: [],
    };
  }
  
  // Validate and fix exercise data
  const validatedWorkoutDays = parsed.workoutDays.map((day: any) => {
    let exerciseOrder = 1;
    const processedExercises: any[] = [];
    
    // Process exercises with proper ordering and superset grouping
    for (let i = 0; i < day.exercises.length; i++) {
      const exercise = day.exercises[i];
      const nextExercise = day.exercises[i + 1];
      
      // Check if this exercise should be A1 (has a static stretch after it)
      const isFollowedByStretch = nextExercise?.exerciseName?.includes('Static Stretch');
      
      // Check if this is a static stretch
      const isStaticStretch = exercise.exerciseName?.includes('Static Stretch');
      
      // Determine superset group
      let supersetGroup = exercise.supersetGroup;
      
      // If this exercise is followed by a stretch, make it A1
      if (isFollowedByStretch && (!supersetGroup || supersetGroup === 'A')) {
        supersetGroup = 'A1';
      }
      
      // If this is a static stretch, make it A2
      if (isStaticStretch) {
        if (!supersetGroup || supersetGroup === 'A') {
          supersetGroup = 'A2';
        } else if (supersetGroup === 'B') {
          supersetGroup = 'B2';
        } else if (supersetGroup === 'C') {
          supersetGroup = 'C2';
        }
      }
      
      processedExercises.push({
        ...exercise,
        // Fix warmup sets - should be 0-5
        warmupSets: validateWarmupSets(exercise.warmupSets),
        // Fix working sets - should be 1-10
        workingSets: validateWorkingSets(exercise.workingSets),
        // Fix RPE - should be 1-10 or special strings
        rpe: validateRPE(exercise.rpe),
        // Use sequential ordering
        exerciseOrder: exerciseOrder++,
        // Apply corrected superset group
        supersetGroup: supersetGroup || null,
      });
    }
    
    return {
      ...day,
      exercises: processedExercises,
    };
  });

  return {
    phaseName: parsed.phaseName || sheetName,
    phaseNumber,
    description: parsed.description || null,
    workoutDays: validatedWorkoutDays,
  };
}

// Validation functions to fix bad data
function validateWarmupSets(value: any): number {
  const num = parseInt(value);
  // If it's a huge number (likely Excel date), default to 2
  if (num > 100) {
    console.warn(`Invalid warmup sets value ${value}, defaulting to 2`);
    return 2;
  }
  // Clamp to reasonable range
  if (num < 0) return 0;
  if (num > 5) return 5;
  return num || 0;
}

function validateWorkingSets(value: any): number {
  const num = parseInt(value);
  // If it's a huge number (likely Excel date), default to 3
  if (num > 100) {
    console.warn(`Invalid working sets value ${value}, defaulting to 3`);
    return 3;
  }
  // Clamp to reasonable range
  if (num < 1) return 1;
  if (num > 10) return 10;
  return num || 3;
}

function validateRPE(value: any): string {
  if (!value) return "N/A";
  
  // Handle string values
  if (typeof value === 'string') {
    // Keep special values
    if (value.toLowerCase().includes('see notes') || value.toLowerCase() === 'n/a') {
      return value;
    }
    // Try to extract a number
    const match = value.match(/\d+(\.\d+)?/);
    if (match) {
      const num = parseFloat(match[0]);
      if (num >= 1 && num <= 10) {
        return num.toString();
      }
    }
  }
  
  // Handle numeric values
  const num = parseFloat(value);
  if (!isNaN(num)) {
    // If it's a huge number (likely Excel date), default to 8
    if (num > 100) {
      console.warn(`Invalid RPE value ${value}, defaulting to 8`);
      return "8";
    }
    // Clamp to valid range
    if (num >= 1 && num <= 10) {
      return num.toString();
    }
  }
  
  // Default to 8 if nothing else works
  console.warn(`Invalid RPE value ${value}, defaulting to 8`);
  return "8";
}
