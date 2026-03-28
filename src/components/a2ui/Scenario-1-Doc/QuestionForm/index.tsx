interface QuestionFormProps {
    questions: {
        question: string;
        hasInput: boolean;
        placeholder?: string; // only for hasInput===true
    }[];
}

const QuestionForm = ({ questions }: QuestionFormProps) => {
    return (
        <div>
            {/** Return Component */}
        </div>
    )
}

export default QuestionForm;