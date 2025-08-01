import React from 'react';
import { FaEdit } from 'react-icons/fa';
import styles from '@/src/styles/index.module.scss';

const ZeroTierUserList = ({ groupedUsers, handleEdit }) => {
    return (
        <>
            {Object.entries(groupedUsers).map(([name, userList]) => (
                <div key={name} className={`mb-4 p-3 rounded ${styles.blur}`}>
                    <h5>{name ? name : "Unknown"}</h5>

                    {userList.map((user, index) => (
                        <div
                            key={user.id || index}
                            className="d-flex align-items-center mb-2 ps-3"
                            style={{gap: '12px'}}
                        >
                            {user.config.authorized ? (
                                <span className="me-3" style={{minWidth: '200px'}}>
                    {user.description}
                  </span>
                            ): (
                                <span className="me-3 text-danger" style={{minWidth: '200px'}}>
                    {user.description}
                  </span>
                            )}

                            <span style={{minWidth: '120px'}}>
                    {user.config.ipAssignments[0]}
                  </span>
                            <button
                                className="btn btn-sm btn-link ms-auto"
                                title="Edit"
                                onClick={() => handleEdit(user)}
                                aria-label={`Edit ${user.description}`}
                            >
                                <FaEdit size={18} color="white" />
                            </button>
                        </div>
                    ))}
                </div>
                ))}
        </>
    );
};

export default ZeroTierUserList;