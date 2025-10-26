import ExerciseCard from '../ExerciseCard';

export default function ExerciseCardExample() {
  return (
    <div className="p-8 max-w-md">
      <ExerciseCard
        exerciseName="Barbell Squat"
        alternateExercise="Goblet Squat"
        sets={4}
        warmupSets={2}
        restTimer={180}
        rpe={8}
        repRangeMin={8}
        repRangeMax={12}
      />
    </div>
  );
}
