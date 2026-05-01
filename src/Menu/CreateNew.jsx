import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";
import QuizEditor from "./QuizEditor";

const CreateNew = () => {
  const { editingQuiz } = useContext(AppContext);

  return (
    <QuizEditor
      editingIndex={editingQuiz?.index}
      initialQuiz={editingQuiz?.quiz}
      title={editingQuiz ? "Edytuj quiz" : "Stwórz quiz"}
    />
  );
};

export default CreateNew;
