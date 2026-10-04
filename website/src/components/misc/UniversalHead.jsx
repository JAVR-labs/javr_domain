import Head from 'next/head';

function UniversalHead({ children }) {
    return (
        <>
            <Head>
                <title>JAVR Domain</title>
                <link rel="icon" type="image/x-icon" href="/img/favicon.ico" />
                {children}
            </Head>
        </>
    );
}

export default UniversalHead;
