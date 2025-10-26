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
  
  // Process each sheet as a phase
  const phases: ParsedPhase[] = [];
  
  for (let i = 0; i < workbook.SheetNames.length; i++) {
    const sheetName = workbook.SheetNames[i];
    const sheet = workbook.Sheets[sheetName];
    const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    
    // Use OpenAI to parse this phase
    const phase = await parsePhaseWithOpenAI(sheetName, sheetData, i + 1);
    phases.push(phase);
  }
  
  return {
    programName,
    phases,
  };
}

async function parsePhaseWithOpenAI(
  sheetName: string,
  sheetData: any[][],
  phaseNumber: number
): Promise<ParsedPhase> {
  const completion = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: `You are an expert fitness coach analyzing workout program spreadsheets. Parse this workout phase and extract its structure.

Your task:
1. Extract the phase name and description
2. Identify all workout days (e.g., "Push #1", "Pull #1", "Legs #1", etc.)
3. For each workout day, extract all exercises with their details
4. Recognize supersets (marked with A1/A2 or B1/B2 prefixes)
5. Include rest days in the weekly schedule if apparent

For each exercise, extract:
- exerciseName: The exercise name (without superset prefixes)
- warmupSets: Number of warmup sets (default 0)
- workingSets: Number of working sets
- reps: Rep prescription (keep as string, e.g., "8-10", "10+5", "30s HOLD")
- load: Load prescription if specified (e.g., "75% 1RM")
- rpe: RPE target (keep as string, can be number, "See Notes", or "N/A")
- restTimer: Rest time between sets (keep as string, e.g., "~3-4 min", "0 min")
- substitutionOption1: First substitution option
- substitutionOption2: Second substitution option
- notes: Exercise notes/cues
- supersetGroup: Superset identifier if applicable (e.g., "A1", "A2", "B1", "B2")
- exerciseOrder: Order in the workout (1, 2, 3, etc.)

Return a JSON object with:
{
  "phaseName": "Phase name",
  "description": "Phase description",
  "workoutDays": [
    {
      "dayName": "Push #1" | "Pull #1" | "Legs #1" | "REST",
      "dayNumber": 1,
      "isRestDay": false,
      "weekNumber": 1,
      "exercises": [ ... ]
    }
  ]
}

IMPORTANT: 
- If the program has 5-6 workout days per week, suggest adding 1-2 rest days
- Typical patterns: Push/Pull/Legs/Push/Pull/REST/REST or Push/Pull/REST/Legs/Push/Pull/REST
- Keep all text values exactly as they appear (don't convert to numbers unless absolutely necessary)`,
      },
      {
        role: "user",
        content: `Parse this workout phase. Sheet name: "${sheetName}"

Sheet data:
${JSON.stringify(sheetData, null, 2)}

Return the parsed phase structure as JSON.`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const parsed = JSON.parse(content);
  
  return {
    phaseName: parsed.phaseName || sheetName,
    phaseNumber,
    description: parsed.description,
    workoutDays: parsed.workoutDays || [],
  };
}
