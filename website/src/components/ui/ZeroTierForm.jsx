import React from 'react';
import styles from '@/src/styles/index.module.scss';

const ZeroTierForm = ({ user, formData, onChange, onSubmit, onCancel }) => {
    return (
        <form onSubmit={onSubmit} className={`mb-4 p-4 rounded-3 ${styles.blur} text-white`}>
            <h5 className="mb-4">Edytuj urządzenie: {user.name}</h5>

            {/* Name Input Field */}
            <div className="mb-3">
                <label htmlFor="name" className="form-label">Nazwa:</label>
                <input
                    id="name"
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={onChange}
                    required
                />
            </div>

            {/* Description Input Field */}
            <div className="mb-3">
                <label htmlFor="description" className="form-label">Opis:</label>
                <input
                    id="description"
                    type="text"
                    name="description"
                    className="form-control"
                    value={formData.description}
                    onChange={onChange}
                />
                <small className="form-text text-white-50">
                    Podaj typ urządzenia np. PC lub laptop.
                </small>
            </div>

            {/* Authorization Switch */}
            <div className="form-check form-switch mb-4">
                <input
                    id="authorize"
                    type="checkbox"
                    name="authorize"
                    className="form-check-input"
                    checked={formData.authorize}
                    onChange={onChange}
                    role="switch"
                />
                <label className="form-check-label" htmlFor="authorize">
                    Autoryzuj urządzenie
                </label>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                    Zapisz zmiany
                </button>
                <button type="button" onClick={onCancel} className="btn btn-outline-light">
                    Anuluj
                </button>
            </div>
        </form>
    );
};

export default ZeroTierForm;
