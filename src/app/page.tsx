import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import styles from './page.module.css';
import ConverterClient from './ConverterClient';
import AdminDashboard from '../components/AdminDashboard';

const JWT_SECRET = process.env.JWT_SECRET;

async function checkAdminAuth() {
  const cookieStore = cookies();
  const isLoggedIn = (await cookieStore).get('isLoggedIn')?.value;
  return isLoggedIn === 'true';
}

export default async function Page() {
  const isAdmin = await checkAdminAuth();
  console.log('isAdmin:', isAdmin);

  return (
    <main className={styles.mainContainer}>
      <h1 className={styles.title}>YouTube Converter</h1>
      <ConverterClient isAdmin={isAdmin} />
      <AdminDashboard isAdmin={isAdmin} />
    </main>
  );
}