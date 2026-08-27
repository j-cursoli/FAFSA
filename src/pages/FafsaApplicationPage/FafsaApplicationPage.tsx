import { Text, Title } from '@mantine/core'
import { FafsaWizard } from './wizard'
import styles from './FafsaApplicationPage.module.css'

export function FafsaApplicationPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Title order={1} className={styles.title}>
          Free Application for Federal Student Aid
        </Title>

        <Text c="dimmed">
          Enter your information to apply for federal student aid. Your answers are checked as
          you go, and you can review everything before submitting.
        </Text>
      </header>

      <FafsaWizard />
    </main>
  )
}
