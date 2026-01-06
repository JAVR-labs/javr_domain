import NavBar from '@/src/components/layout/Navbar/NavBar.jsx';
import UniversalHead from '@components/misc/UniversalHead.jsx';
import Footer from "@/src/components/layout/Footer/Footer.jsx";
import styles from '@/src/styles/zt.module.scss';
import {mainDivClass} from "@styles/global.bootstrap.js";
import StripedList from '../components/ui/StripedList/StripedList';
import React, {useEffect, useState} from 'react';
import {innitZTSocket, requestZTData, ztSendForm} from '@utils/socket-util';
import ZeroTierUserList from "@components/ui/ZeroTierUserList";
import ZeroTierForm from "@components/ui/ZeroTierForm";

function MainContent() {
    const [users, setUsers] = useState([]);
    const [usersError, setUsersError] = useState("");
    const [editUser, setEditUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        description: '',
        authorized: false,
    });

    useEffect(() => {
        const cleanup = innitZTSocket(setUsers, setUsersError);
        requestZTData();
        return cleanup;
    }, [users, editFormData]);

    // Group users by user.name
    const groupedUsers = users.reduce((acc, user) => {
        if (!acc[user.name]) acc[user.name] = [];
        acc[user.name].push(user);
        return acc;
    }, {});

    const pickEditUser = (user) => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        setEditUser(user);

        setEditFormData({
            name: user.name || '',
            description: user.description || '',
            authorized: user.config.authorized !== undefined ? user.config.authorized : false,
        });
    };


    // Form input change handler
    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };


    // Submit edited user data
    const handleEditSubmit = (e) => {
        e.preventDefault();

        setUsers(users.map(u => {
            if (u === editUser) {
                return {
                    ...u,
                    name: editFormData.name,
                    description: editFormData.description,
                    config: {
                        ...u.config,
                        authorized: [editFormData.authorized]
                    }
                };
            }
            return u;
        }));

        ztSendForm(editFormData, editUser.config.address)
    };

    // Close & cancel editing
    const closeEdit = () => {
        setEditUser(null);
    };

    if (usersError) {
        return (
            <div className="container-sm color-status-bg mt-5 p-5 rounded-4">
                <StripedList>
                    <p>{usersError}</p>
                </StripedList>
            </div>
        );
    }

    return (
        <div className="container-sm mt-5 p-4">
            {editUser && (
                <ZeroTierForm
                    user={editUser}
                    formData={editFormData}
                    onChange={handleEditChange}
                    onSubmit={handleEditSubmit}
                    onClose={closeEdit}
                />
            )}

            {users.length === 0 ? (
                <div className="text-center p-5">
                    <div className="spinner-border text-light" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <ZeroTierUserList
                    groupedUsers={groupedUsers}
                    handleEdit={pickEditUser}
                />
            )}
        </div>
    );
}

function Home() {
    return (
        <>
            {/* Head */}
            <UniversalHead/>

            {/* Body */}
            <div className={`${styles.bgImgZt} ${mainDivClass}`}>
                <NavBar/>
                <MainContent/>
            </div>

            {/* Footer */}
            <Footer/>
        </>
    );
}

export default Home;
