import react, { useState } from "react";
import { Background } from "reactflow";

const Testing = () => {
	const [clicked, setClicked] = useState<boolean>(false);
	return (
		<div style={{ width: "100%", height: "100%" }}>
			<div style={{ height: "80%", display: 'flex', flexDirection: 'column'}}>
				<div style={{ backgroundColor: "red", flex: "0 0 auto" }}>Top content (always visible)<br />
				{Array(3).fill("top").join(" | ")}</div>
				<div style={{ backgroundColor: "#ffffcc", flex: "1 1 auto" }}>Middle content (scrollable if too large)<br />
				{Array(100).fill("middle").join(" | ")}</div>
				<div style={{ backgroundColor: "#5555ff", flex: "0 0 auto" }}>Bottom content (always visible)<br />
				{Array(3).fill("bottom").join(" | ")}</div>
			</div>

			<div style={{ textAlign: "center" }}>
				<button onClick={() => setClicked((cur) => !cur)}></button>
			</div>
		</div>
	);
};

export default Testing;
