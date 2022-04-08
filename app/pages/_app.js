import '../styles/globals.scss';
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import LayoutComponent from '../components/layout/LayoutComponent';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Aada - Lending protocol</title>
        <meta name="description" content="Aada Dao - Decentralized Liquidity Protocol on Cardano" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <LayoutComponent>
        <Component {...pageProps} />
      </LayoutComponent>
    </>
  );
}



export default MyApp;