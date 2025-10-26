import * as XLSX from "xlsx";
import Papa from "papaparse";
import openai from "./openai";
import type { InsertExercise } from "@shared/schema";

interface ParsedExercise {
  exerciseName: string;
  alternateExercise?: string;
  sets: number;
  warmupSets: number;
  restTimer: number;
  rpe?: number;
  repRangeMin: number;
  repRangeMax: number;
}

export async function parseSpreadsheet(
  buffer: Buffer,
  filename: string,
  workoutId: string
): Promise<InsertExercise[]> {
  // Extract raw data from spreadsheet
  const rawData = await extractDataFromFile(buffer, filename);
  
  // Use OpenAI to parse the data
  const exercises = await parseWithOpenAI(rawData);
  
  // Convert to InsertExercise format with workoutId
  return exercises.map(ex => ({
    workoutId,
    exerciseName: ex.exerciseName,
    alternateExercise: ex.alternateExercise || null,
    sets: ex.sets,
    warmupSets: ex.warmupSets,
    restTimer: ex.restTimer,
    rpe: ex.rpe || null,
    repRangeMin: ex.repRangeMin,
    repRangeMax: ex.repRangeMax,
  }));
}

async function extractDataFromFile(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop();
  
  if (ext === 'csv') {
    // Parse CSV
    const text = buffer.toString('utf-8');
    const result = Papa.parse(text, { header: false });
    return JSON.stringify(result.data);
  } else if (ext === 'xlsx' || ext === 'xls') {
    // Parse Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    return JSON.stringify(data);
  } else {
    throw new Error('Unsupported file format');
  }
}

async function parseWithOpenAI(rawData: string): Promise<ParsedExercise[]> {
  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  const completion = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: `You are an expert fitness coach analyzing workout spreadsheets. Extract exercise information from the provided spreadsheet data.

For each exercise, extract:
- exerciseName: The name of the exercise
- alternateExercise: Any alternate/substitute exercise mentioned (optional)
- sets: Number of working sets (not including warmup)
- warmupSets: Number of warmup sets (default 0 if not specified)
- restTimer: Rest time in seconds between sets
- rpe: Rate of Perceived Exertion (1-10 scale, optional)
- repRangeMin: Minimum reps per set
- repRangeMax: Maximum reps per set

Return a JSON object with an "exercises" array. If rest time is given in minutes, convert to seconds.

Important parsing rules:
- If a cell says "3x8-12" that means 3 sets of 8-12 reps
- If it says "4 sets x 10 reps" that means 4 sets, repRangeMin=10, repRangeMax=10
- Common rest times: 60s, 90s, 120s (2min), 180s (3min), 240s (4min)
- Default rest if not specified: 90 seconds
- If RPE not specified, leave it null
- Look for alternate exercises in parentheses or after "or" / "alternative:"

Response format: { "exercises": [ { ...exercise data... } ] }`,
      },
      {
        role: "user",
        content: `Parse this workout spreadsheet data:\n\n${rawData}\n\nReturn a JSON object with an exercises array.`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const parsed = JSON.parse(content);
  
  // Handle both { exercises: [...] } and direct array formats
  const exercises = Array.isArray(parsed) ? parsed : (parsed.exercises || []);
  
  if (!Array.isArray(exercises) || exercises.length === 0) {
    throw new Error("No exercises found in the spreadsheet");
  }
  
  return exercises;
}
