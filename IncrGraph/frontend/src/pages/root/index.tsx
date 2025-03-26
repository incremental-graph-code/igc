import { FC, ReactNode } from "react";
import GitHubIcon from "@mui/icons-material/GitHub";
import "./root.css";
import Navbar from "../../components/NavBar";
import { STYLES } from "@/styles/constants";
import { Box} from "@mui/material";
import { AppProviders } from "@/providers/AppProviders";

interface RootPageProps {
	children?: ReactNode;
}

const RootPage: FC<RootPageProps> = ({ children }) => {
	return (
		<AppProviders>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					height: "100vh",
					overflow: "hidden",
				}}
			>
				<Navbar />
				<Box
					component="main"
					sx={{
						flexGrow: 1,
						overflow: "hidden",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						p: "3px",
					}}
				>
					{children}
				</Box>
				{/* <Box
						component="footer"
						sx={{
							position: "relative",
							p: 0,
							bgcolor: "background.paper",
							boxShadow: "0 -4px 8px rgba(0, 0, 0, 0.2)", // Floating shadow
							zIndex: 1,
						}}
					>
						<Container maxWidth="lg">
							{/* <div className="footer-logo">
								
							</div> */}
				{/* <div
								className="footer-social"
								style={{ textAlign: "center", height: STYLES.footerHeight }}
							>
                                <p>Incremental Graph Code</p>
                                <span style={{width: "200px"}}></span>
								<a
									href="https://github.com/MaxMB15/MSc-SE-Master-Project/tree/main/IncrGraph"
									target="_blank"
									rel="noopener noreferrer"
								>
									<GitHubIcon style={{ color: "#ffffff" }} />
								</a>
							</div>
						</Container>
					</Box> */}
				{/* <div style={{ flexGrow: 1}}>{children}</div> */}
				{/* <div style={{height: "550px", width: "100%", display: "block"}}></div> */}
				<div className="footer">
					<div className="footer-content">
						<div className="footer-logo">
							<p>Incremental Graph Code</p>
						</div>
						<div
							className="footer-social"
							style={{ height: STYLES.footerHeight }}
						>
							<a
								href="https://github.com/MaxMB15/MSc-SE-Master-Project/tree/main/IncrGraph"
								target="_blank"
								rel="noopener noreferrer"
								style={{ paddingRight: "50px" }}
							>
								<GitHubIcon style={{ color: "#ffffff" }} />
							</a>
						</div>
					</div>
				</div>
			</Box>
		</AppProviders>
	);
};

export default RootPage;
