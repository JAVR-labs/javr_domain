import React from 'react';

import styles from './StripedList.module.scss';

const listClasses = `${styles.stripedList} list-group border-dark`;
const listElClasses = 'list-group-item d-flex';

function StripedList({ children }) {
    return (
        <ul className={listClasses}>
            {React.Children.map(children, (child, index) => (
                <li key={index} className={listElClasses}>
                    {child}
                </li>
            ))}
        </ul>
    );
}

export default StripedList;
