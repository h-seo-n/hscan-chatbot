import { useEffect, useState } from "react";
import styles from "./QuestionForm.module.css";

interface QuestionFormItem {
  question: string;
  hasInput: boolean;
  placeholder?: string;
  checked?: boolean;
}

interface QuestionFormProps {
  questions: QuestionFormItem[];
  submitLabel?: string;
  onSubmit?: () => void;
  onSelectionChange?: (selectedQuestions: QuestionFormItem[]) => void;
  onInputChange?: (values: string[]) => void;
}

const fallbackQuestions: QuestionFormItem[] = [
  { question: "질문 1", hasInput: true, placeholder: "placeholder1" },
  { question: "질문 2", hasInput: true, placeholder: "placeholder2" },
  { question: "질문 3", hasInput: false, checked: true },
];

const QuestionForm = ({
  questions,
  submitLabel = "완료",
  onSubmit,
  onSelectionChange,
  onInputChange,
}: QuestionFormProps) => {
  const items = questions.length > 0 ? questions : fallbackQuestions;
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    items.map((item) => Boolean(item.checked)),
  );
  const [inputValues, setInputValues] = useState<string[]>(
    items.map(() => ""),
  );

  useEffect(() => {
    setCheckedItems(items.map((item) => Boolean(item.checked)));
    setInputValues(items.map(() => ""));
  }, [questions]);

  useEffect(() => {
    onSelectionChange?.(
      items.filter((_, index) => checkedItems[index]),
    );
  }, [checkedItems, items, onSelectionChange]);

  useEffect(() => {
    onInputChange?.(inputValues);
  }, [inputValues, onInputChange]);

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
                className={`${styles.checkbox} ${checkedItems[index] ? styles.checked : ""}`}
                onClick={() => handleToggle(index)}
                type="button"
              >
                {checkedItems[index] ? <span className={styles.checkmark} /> : null}
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
                {item.hasInput ? (
                  <input
                    className={`${styles.placeholderInput} ${!checkedItems[index] ? styles.placeholderInputDisabled : ""}`}
                    disabled={!checkedItems[index]}
                    onChange={(event) => handleInputChange(index, event.target.value)}
                    placeholder={item.placeholder}
                    type="text"
                    value={inputValues[index]}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <button className={styles.submitButton} onClick={onSubmit} type="button">
          {submitLabel}
        </button>
      </div>
    </div>
  );
};

export default QuestionForm;
