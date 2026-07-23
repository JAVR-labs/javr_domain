import NavBar from '@/src/components/layout/Navbar/NavBar.jsx';
import UniversalHead from '@components/misc/UniversalHead.jsx';
import Footer from '@/src/components/layout/Footer/Footer.jsx';
import styles from '@/src/styles/index.module.scss';
import { mainDivClass } from '@styles/global.bootstrap.js';

function MainContent() {
    return (
        <>
            <div className={`max-width-4 ${styles.styleMainTile} mt-5`}>
                <h1>Witamy, w domenie JAVR-u!</h1>
                <div className="mt-5">
                    <h5>
                        Strona główna w trakcie budowy (reszta funkcjonalna).
                    </h5>
                </div>
            </div>
        </>
    );
}

function Home() {
    return (
        <>
            {/* Head */}
            <UniversalHead />

            {/* Body */}
            <div className={`${styles.bgImgMain} ${mainDivClass}`}>
                <NavBar />
                <MainContent />
            </div>

            {/* Footer */}
            <Footer />
        </>
    );
}

export default Home;
