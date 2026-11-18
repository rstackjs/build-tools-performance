import { useTranslation } from 'react-i18next';
import styles from '../app/Shell.module.css';

export function LocaleSwitcher() {
  const { i18n } = useTranslation();
  return (
    <select
      aria-label="Interface language"
      className={styles.locale}
      value={i18n.language}
      onChange={(event) => {
        void i18n.changeLanguage(event.target.value);
      }}
    >
      <option value="en">English</option>
      <option value="zh">简体中文</option>
    </select>
  );
}
