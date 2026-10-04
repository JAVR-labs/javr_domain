import styles from './DataTable.module.scss';
import { AnimatePresence, motion } from 'framer-motion';

function DataTable(data) {
    const columns = data.columns;
    const items = data.items;

    return (
        <div className={styles.listContainer}>
            {columns.map((column, columnIndex) => (
                <div key={columnIndex} className={styles.dataContainer}>
                    <ul>
                        <li className={styles.header}>{column}</li>

                        {items[columnIndex].map((item, itemIndex) => (
                            <li key={itemIndex}>
                                <div className={styles.entry}>
                                    <AnimatePresence>
                                        <span
                                            style={{
                                                color: item[2]
                                                    ? item[2]
                                                    : '#dee2e6',
                                            }}
                                        >
                                            {`${item[0]}: `}

                                            <motion.span
                                                key={item[1]}
                                                initial={{
                                                    rotateX: 90,
                                                    opacity: 0,
                                                }}
                                                animate={{
                                                    rotateX: 0,
                                                    opacity: 1,
                                                }}
                                                exit={{
                                                    rotateX: -90,
                                                    opacity: 0,
                                                }}
                                                transition={{
                                                    duration: 0.5,
                                                    ease: 'easeInOut',
                                                }}
                                                className={styles.data}
                                            >
                                                {item[1]}
                                            </motion.span>
                                        </span>
                                    </AnimatePresence>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

export default DataTable;
