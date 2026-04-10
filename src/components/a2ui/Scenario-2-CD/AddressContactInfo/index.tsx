import type { FormEvent } from "react";
import { useId, useState } from "react";
import { FiSearch } from "react-icons/fi";
import styles from "./AddressContactInfo.module.css";

interface AddressContactInfoInitialValues {
  address?: string;
  addressDetail?: string;
  name?: string;
  tel?: string;
}

interface AddressContactInfoProps {
  onSubmit: (
    address: string,
    addressDetail: string,
    name: string,
    tel: string,
  ) => void;
  initialValues?: AddressContactInfoInitialValues;
}

const fallbackAddressContactInfo: Required<AddressContactInfoInitialValues> = {
  address: "서울특별시 강남구 테헤란로 123",
  addressDetail: "삼성동 123-45",
  name: "홍길동",
  tel: "010-1234-5678",
};

const SearchIcon = () => <FiSearch aria-hidden="true" className={styles.searchIcon} />;

export default function AddressContactInfo({
  onSubmit,
  initialValues,
}: AddressContactInfoProps) {
  const addressId = useId();
  const addressDetailId = useId();
  const nameId = useId();
  const telId = useId();

  const initial = {
    ...fallbackAddressContactInfo,
    ...initialValues,
  };

  const [address, setAddress] = useState(initial.address);
  const [addressDetail, setAddressDetail] = useState(initial.addressDetail);
  const [name, setName] = useState(initial.name);
  const [tel, setTel] = useState(initial.tel);

  const isComplete =
    address.trim().length > 0 &&
    addressDetail.trim().length > 0 &&
    name.trim().length > 0 &&
    tel.trim().length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isComplete) {
      return;
    }

    onSubmit(address.trim(), addressDetail.trim(), name.trim(), tel.trim());
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <section className={styles.card}>
        <div className={styles.cardContent}>
          <p className={styles.description}>
            등기우편 발송을 위해 <strong>배송지 주소</strong>를 입력해 주세요
          </p>

          <div className={styles.inputGroup}>
            <label className={styles.searchField} htmlFor={addressId}>
              <SearchIcon />
              <input
                autoComplete="street-address"
                id={addressId}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="지번 또는 도로명 검색"
                type="text"
                value={address}
              />
            </label>

            <label className={styles.hiddenLabel} htmlFor={addressDetailId}>
              상세주소
            </label>
            <input
              autoComplete="address-line2"
              className={styles.textField}
              id={addressDetailId}
              onChange={(event) => setAddressDetail(event.target.value)}
              placeholder="상세주소 입력"
              type="text"
              value={addressDetail}
            />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardContent}>
          <p className={styles.contactDescription}>
            <strong>이름</strong>과 <strong>휴대전화번호</strong>를 확인해주세요.
            <br />
            맞지 않다면 클릭해서 수정해주세요.
          </p>

          <div className={styles.fieldBlock}>
            <label className={styles.label} htmlFor={nameId}>
              이름
            </label>
            <input
              autoComplete="name"
              className={styles.textField}
              id={nameId}
              onChange={(event) => setName(event.target.value)}
              placeholder="이름을 입력해주세요"
              type="text"
              value={name}
            />
          </div>

          <div className={styles.fieldBlock}>
            <label className={styles.label} htmlFor={telId}>
              휴대전화 번호
            </label>
            <input
              autoComplete="tel"
              className={styles.textField}
              id={telId}
              inputMode="tel"
              onChange={(event) => setTel(event.target.value)}
              placeholder="휴대전화 번호를 입력해주세요"
              type="tel"
              value={tel}
            />
          </div>
        </div>
      </section>

      <button className={styles.submitButton} disabled={!isComplete} type="submit">
        입력 완료
      </button>
    </form>
  );
}
