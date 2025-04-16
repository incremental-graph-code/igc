import { FC, ReactNode } from "react";
import "./root.css";
import Navbar from "../../components/NavBar";
import { Box} from "@mui/material";
import { AppProviders } from "@/providers/AppProviders";
import Footer from "@/components/Footer";

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
				
				<Footer />
			</Box>
		</AppProviders>
	);
};

export default RootPage;
