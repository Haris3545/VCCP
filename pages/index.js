import { isAuthedRequestCookie } from '@/lib/auth';

export default function IndexPage() {
  return null;
}

export async function getServerSideProps({ req }) {
  const authed = isAuthedRequestCookie(req.headers.cookie);
  return {
    redirect: {
      destination: authed ? '/dashboard' : '/login',
      permanent: false,
    },
  };
}
