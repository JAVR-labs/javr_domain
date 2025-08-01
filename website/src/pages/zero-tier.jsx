import NavBar from '@/src/components/layout/Navbar/NavBar.jsx';
import UniversalHead from '@components/misc/UniversalHead.jsx';
import Footer from "@/src/components/layout/Footer/Footer.jsx";
import styles from '@/src/styles/index.module.scss';
import {mainDivClass} from "@styles/global.bootstrap.js";
import StripedList from '../components/ui/StripedList/StripedList';
import React, {useEffect, useState} from 'react';
import {innitZTSocket, requestZTData, ztSendForm} from '@utils/socket-util';
import ZeroTierUserList from "@components/ui/ZeroTierUserList";
import ZeroTierForm from "@components/ui/ZeroTierForm";

function MainContent() {
    const [users, setUsers] = useState([]);
    const [usersError, setUsersError] = useState("");
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        description: '',
        authorize: true,
    });

    useEffect(() => {
        const cleanup = innitZTSocket(setUsers, setUsersError);
        requestZTData();
        return cleanup;
    }, []);

    // Group users by user.name
    const groupedUsers = users.reduce((acc, user) => {
        if (!acc[user.name]) acc[user.name] = [];
        acc[user.name].push(user);
        return acc;
    }, {});

    const handleEdit = (user) => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        console.log(user);

        setEditingUser(user);
        setEditFormData({
            name: user.name || '',
            description: user.description || '',
            authorize: user.authorize !== undefined ? user.authorize : true,
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
            if (u === editingUser) {
                return {
                    ...u,
                    name: editFormData.name,
                    description: editFormData.description,
                    config: {
                        ...u.config,
                        authorized: [editFormData.authorize]
                    }
                };
            }
            return u;
        }));

        console.log(editFormData);

        ztSendForm(editFormData, editingUser.config.address)

        setEditingUser(null);
    };

    // Cancel editing
    const cancelEdit = () => {
        setEditingUser(null);
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
            {editingUser && (
                <ZeroTierForm
                    user={editingUser}
                    formData={editFormData}
                    onChange={handleEditChange}
                    onSubmit={handleEditSubmit}
                    onCancel={cancelEdit}
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
                    handleEdit={handleEdit}
                />
            )}
        </div>
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
