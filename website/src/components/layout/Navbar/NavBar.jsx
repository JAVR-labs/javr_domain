import NavLogo from "@/src/components/ui/NavLogo.jsx";
import {useRouter} from "next/router";
import styles from "./navbar.module.scss"

const urls = {Home: "/", Services: "/services", ZeroTier: "/zero-tier", TerraMetrics: "/terra-metrics"};

function NavList() {
    const router = useRouter();
    const { pathname } = router;

    const navOps = Object.keys(urls).map((page) => {
        // If user is already on the website
        if (urls[page] === pathname) {
            return (
                <li key={page} className="nav-item ms-2">
                    <a className={`${styles.customNavLink} ${styles.inactive} nav-link`} href="#">{page}</a>
                </li>
            );
        }
        // All other pages
        else {
            return (
                <li key={page} className="nav-item ms-2">
                    <a className={`${styles.customNavLink} nav-link`} href={urls[page]}>{page}</a>
                </li>
            );
        }
    });

    return (
        <div className="collapse navbar-collapse ms-3" id="navbarNav">
            <ul className='navbar-nav'>
                {navOps}
            </ul>
        </div>
    );
}

function NavBar() {
    return (
        <>
            <nav className={`navbar navbar-expand-sm ${styles.styleNavbar}`}>
                <div className="container-fluid">
                    <NavLogo/>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
                            data-bs-target="#navbarNav"
                            aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <NavList/>
                </div>
            </nav>
        </>
    );
}

export default NavBar;