import React from 'react';
import { FaEdit } from 'react-icons/fa';
import styles from '@/src/styles/zt.module.scss';

const ZeroTierUserList = ({ groupedUsers, handleEdit }) => {
    return (
        <>
            {Object.entries(groupedUsers).map(([name, userList]) => (
                <div key={name} className={`mb-4 p-3 rounded blur`}>
                    <h5 className={`border-bottom ${styles.userName}`}>{name ? name : "Unknown"}</h5>

                    <table className={`table table-borderless mb-0 ${styles.userTable}`}>
                        <tbody>
                        {userList.map((user, index) => (
                            <tr key={user.id || index}>
                                <td
                                    className={`ps-3 ${!user.config.authorized ? 'text-danger' : ''} ${styles.descriptionCol}`}
                                >
                                    {user.description}
                                </td>

                                <td className={styles.ipCol}>
                                    {user.config.ipAssignments[0]}
                                </td>

                                <td className={`text-end ${styles.actionCol}`}>
                                    <button
                                        className="btn btn-sm btn-link"
                                        title="Edit"
                                        onClick={() => handleEdit(user)}
                                        aria-label={`Edit ${user.description}`}
                                    >
                                        <FaEdit size={18} color="white" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </>

    );
};

export default ZeroTierUserList;