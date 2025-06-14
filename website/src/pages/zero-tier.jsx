import NavBar from '@/src/components/layout/Navbar/NavBar.jsx';
import UniversalHead from '@components/misc/UniversalHead.jsx'
import Footer from "@/src/components/layout/Footer/Footer.jsx";
import styles from '@/src/styles/index.module.scss';
import {mainDivClass} from "@styles/global.bootstrap.js";
import StripedList from '../components/ui/StripedList/StripedList';
import {useEffect, useState} from 'react';
import {innitZTSocket, requestZTData} from '../utils/socket-util';
import {ZeroTierForm} from "@components/ui/ZeroTierForm/ZeroTierForm";

function MainContent() {
    const [users, setUsers] = useState([]);


    const [usersError, setUsersError] = useState("");

    useEffect(() => {
        const cleanup = innitZTSocket(setUsers, setUsersError);
        requestZTData();
        return cleanup;
    }, []);


    if (usersError && usersError !== "") {
        return (
            <div className="container-sm color-status-bg mt-5 p-5 rounded-4">
                <StripedList>
                    <p>
                        {usersError}
                    </p>
                </StripedList>
            </div>
        )
    }
    return (
        <>
            <div className="container-sm color-status-bg mt-5 p-5 rounded-4">

                <StripedList>
                    <>
                        <span className="ZT-name w-25">Nazwa</span>
                        <span className="ZT-IP me-auto">Komentarz</span>
                        <span className="ZT-IP ms-auto me-2">Adimg IP</span>
                    </>
                    {
                        users ? users.map((user) => (
                                <>
                                    <span className="w-25">{user.name}</span>
                                    <span className="me-auto">{user.description}</span>
                                    <span className="ms-auto">{user.config.ipAssignments[0]}</span>
                                </>))
                            :
                            <div>{'Loading...'}</div>
                    }
                </StripedList>

                <ZeroTierForm data={users}></ZeroTierForm>

            </div>
        </>
    );
}

function Home() {
    return (
        <>
            {/* Head */}
            <UniversalHead/>

            {/* Body */}
            <div className={`${styles.bgImgMain} ${mainDivClass}`}>
                <NavBar/>
                <MainContent/>
            </div>

            {/* Footer */}
            <Footer/>
        </>
    );
}

export default Home;