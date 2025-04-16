import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import styles from "./index.module.css";

function HomepageHeader() {
	const { siteConfig } = useDocusaurusContext();
	return (
		<header className={clsx("hero hero--primary", styles.heroBanner)}>
			<div className="container">
				<Heading as="h1" className="hero__title">
					{siteConfig.title}
				</Heading>
				<p className="hero__subtitle">{siteConfig.tagline}</p>
				<div
					className={styles.buttons}
					style={{
						display: "flex",
						gap: "1rem",
						flexWrap: "wrap",
						justifyContent: "center",
						marginTop: 32,
					}}
				>
					<Link
						className="button button--secondary button--lg"
						to="/frontend"
					>
						Frontend Docs
					</Link>
					<Link
						className="button button--secondary button--lg"
						to="/backend"
					>
						Backend Docs
					</Link>
					<Link
						className="button button--secondary button--lg"
						to="/electron"
					>
						Electron Docs
					</Link>
					<Link
						className="button button--secondary button--lg"
						to="/shared"
					>
						Shared Docs
					</Link>
				</div>
			</div>
		</header>
	);
}

export default function Home(): ReactNode {
	const { siteConfig } = useDocusaurusContext();
	return (
		<Layout
			title={siteConfig.title}
			description="Modular developer docs for IGC"
		>
			<HomepageHeader />
			<main>
				{/* You can add more homepage features or info here if desired */}
			</main>
		</Layout>
	);
}
