import React, { useState } from 'react';
import styles from './ZeroTierForm.module.scss';
import {ztSendForm} from "@utils/socket-util";

export function ZeroTierForm({ data }) {
    const users = data;
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        authorize: true
    });

    const handleInputChange = (e) => {
        const { id, value, type, checked } = e.target;
        if (id === 'userId') {
            const user = users.find(u => u.config.id === value);
            setSelectedUser(user);
            if (user) {
                setFormData({
                    name: user.name || '',
                    description: user.description || '',
                    authorize: true
                });
            }
        } else {
            setFormData(prevData => ({
                ...prevData,
                [id]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedUser) {
            console.log('Form data submitted:', { ...formData, userId: selectedUser.config.id });

            ztSendForm(formData, selectedUser.config.id);

        } else {
            alert('Proszę wybrać użytkownika');
        }
    };

    return (
        <div className="container mt-4 pl-0 pr-0">
            <form className={styles.zeroTierForm} onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                    <label htmlFor="userId">Wybierz Użytkownika:</label>
                    <select
                        id="userId"
                        className="form-control"
                        value={selectedUser?.config.id || ''}
                        onChange={handleInputChange}
                    >
                        <option value="" disabled>Wybierz użytkownika</option>
                        {users ? users.map((user) => (
                            <option key={user.config.id} value={user.config.id}>{user.name}</option>
                        )) : null}
                    </select>
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="name">Nazwa:</label>
                    <input
                        className={`form-control ${styles.formControl}`}
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="description">Opis:</label>
                    <input
                        className={`form-control ${styles.formControl}`}
                        aria-describedby="descriptionHelp"
                        id="description"
                        type="text"
                        value={formData.description}
                        onChange={handleInputChange}
                    />
                    <small id="descriptionHelp" className="form-text text-muted">Podaj typ urządzenia np. PC lub laptop.</small>
                </div>
                <div className="form-check mb-3">
                    <input
                        className="form-check-input"
                        id="authorize"
                        type="checkbox"
                        checked={formData.authorize}
                        onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="authorize">Autoryzuj</label>
                </div>
                <div className="form-group">
                    <button type="submit" className="btn btn-primary">Prześlij</button>
                </div>
            </form>
        </div>
    );
}