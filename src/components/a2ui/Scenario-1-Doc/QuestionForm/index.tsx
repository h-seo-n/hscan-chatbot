import { useEffect, useState } from "react";
import styles from "./QuestionForm.module.css";

interface QuestionFormItem {
  question: string;
  hasInput: boolean;
  placeholder?: string;
}

interface QuestionFormSubmitPayload {
  selectedQuestions: Array<{
    question: string;
    hasInput: boolean;
    placeholder?: string;
    value: string;
  }>;
}

interface QuestionFormProps {
  questions: QuestionFormItem[];
  onSubmit?: (payload: QuestionFormSubmitPayload) => void;
}

const fallbackQuestions: QuestionFormItem[] = [
  { question: "질문 1", hasInput: true, placeholder: "placeholder1" },
  { question: "질문 2", hasInput: true, placeholder: "placeholder2" },
  { question: "질문 3", hasInput: false},
];

const QuestionForm = ({
  questions,
  onSubmit,
}: QuestionFormProps) => {
  const items = questions.length > 0 ? questions : fallbackQuestions;
  const [checkedItems, setCheckedItems] = useState<boolean[]>(items.map(() => false));
  const [inputValues, setInputValues] = useState<string[]>(items.map(() => ""));

  useEffect(() => {
    setCheckedItems(items.map(() => false));
    setInputValues(items.map(() => ""));
  }, [questions]);

  const handleToggle = (index: number) => {
    setCheckedItems((current) => {
      const targetItem = items[index];
      const isSelecting = !current[index];
      const nextCheckedItems = current.map((isChecked, currentIndex) => {
        if (currentIndex === index) {
          return isSelecting;
        }

        if (!isSelecting) {
          return isChecked;
        }

        const currentItem = items[currentIndex];
        const isOppositeGroup =
          targetItem.hasInput !== currentItem.hasInput;

        return isOppositeGroup ? false : isChecked;
      });

      setInputValues((currentValues) =>
        currentValues.map((currentValue, currentIndex) => {
          const shouldClearCurrentInput =
            currentIndex === index && !nextCheckedItems[index];
          const shouldClearOppositeGroupInput =
            isSelecting &&
            items[currentIndex].hasInput &&
            items[currentIndex].hasInput !== targetItem.hasInput;

          return shouldClearCurrentInput || shouldClearOppositeGroupInput
            ? ""
            : currentValue;
        }),
      );

      return nextCheckedItems;
    });
  };

  const handleInputChange = (index: number, value: string) => {
    setInputValues((current) =>
      current.map((currentValue, currentIndex) =>
        currentIndex === index ? value : currentValue,
      ),
    );
  };

  return (
    <div className={styles.formCard}>
      <div className={styles.content}>
        <div className={styles.questionList}>
          {items.map((item, index) => (
            <div className={styles.questionRow} key={`${item.question}-${index}`}>
              <button
                aria-label={`${item.question} 선택`}
                aria-pressed={checkedItems[index]}
                className={`${styles.checkbox} ${checkedItems[index] && styles.checked}`}
                onClick={() => handleToggle(index)}
                type="button"
              >
                {checkedItems[index] && <span className={styles.checkmark} />}
              </button>
              <div className={styles.questionContent}>
                <button
                  aria-pressed={checkedItems[index]}
                  className={styles.questionTitleButton}
                  onClick={() => handleToggle(index)}
                  type="button"
                >
                  <span className={styles.questionTitle}>{item.question}</span>
                </button>
                {item.hasInput && (
                  <input
                    className={`${styles.placeholderInput} ${!checkedItems[index] && styles.placeholderInputDisabled}`}
                    readOnly={!checkedItems[index]}
                    onFocus={() => {
                      if (!checkedItems[index]) {
                        handleToggle(index);
                      }
                    }}
                    onChange={(event) => handleInputChange(index, event.target.value)}
                    placeholder={item.placeholder}
                    type="text"
                    value={inputValues[index]}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          className={styles.submitButton}
          type="button"
          onClick={() =>
            onSubmit?.({
              selectedQuestions: items
                .map((item, index) => ({
                  ...item,
                  value: inputValues[index],
                }))
                .filter((_, index) => checkedItems[index]),
            })
          }
        >
          완료
        </button>
      </div>
    </div>
  );
};

export default QuestionForm;
