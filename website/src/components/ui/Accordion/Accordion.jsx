import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import styles from './Accordion.module.scss';

const Accordion = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleAccordion = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={styles.accordion}>
            <div className={styles.accordionHeader} onClick={toggleAccordion}>
                <span>{title}</span>
                {React.Children.count(children) > 0 && (
                    <motion.span
                        animate={{ rotate: isOpen ? 0 : 90 }}
                        style={{}}
                        className={styles.accordionButton}
                    />
                )}
            </div>
            <div style={{ position: 'relative' }}>
                <AnimatePresence initial={false}>
                    {isOpen && React.Children.count(children) > 0 && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden' }}
                            transition={{ duration: 0.1 }}
                            className={styles.accordionContent}
                        >
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Accordion;
