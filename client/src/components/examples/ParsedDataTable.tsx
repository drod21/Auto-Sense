import ParsedDataTable from '../ParsedDataTable';

export default function ParsedDataTableExample() {
  const mockExercises = [
    {
      id: "1",
      exerciseName: "Barbell Squat",
      alternateExercise: "Goblet Squat",
      sets: 4,
      warmupSets: 2,
      restTimer: 180,
      rpe: 8,
      repRangeMin: 8,
      repRangeMax: 12,
    },
    {
      id: "2",
      exerciseName: "Bench Press",
      alternateExercise: "Dumbbell Press",
      sets: 3,
      warmupSets: 1,
      restTimer: 120,
      rpe: 9,
      repRangeMin: 6,
      repRangeMax: 10,
    },
  ];

  return (
    <div className="p-8">
      <ParsedDataTable exercises={mockExercises} />
    </div>
  );
}
