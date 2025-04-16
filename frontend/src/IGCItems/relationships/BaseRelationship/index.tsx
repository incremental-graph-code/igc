import { ComponentType, useCallback } from "react";
import { useStore, EdgeProps, MarkerType, EdgeLabelRenderer } from "reactflow";
import { STYLES } from "@/styles/constants";

import {
	createSmartQuadraticPath,
	createSmartSelfLoopPath,
} from "../CustomConnectionLine";
import { Point, RegistryComponent } from "@/types/frontend";
import { createComponent } from "@/utils/componentCache";

// interface BaseRelationshipProps extends EdgeProps {
// 	id: string;
// 	source: string;
// 	target: string;
// 	style?: React.CSSProperties;
// 	data?: {

// 	};
// 	selected?: boolean;
// }
export type IGCRelationshipData<T = {}> = T & {
	backgroundColor?: string;
	offset?: number;
	label?: string;
	labelRadius?: number;
};

export type IGCRelationshipProps<T = {}> = React.FC<
	EdgeProps<IGCRelationshipData<T>>
>;

const RawBaseRelationship: IGCRelationshipProps = ({
	id,
	source,
	target,
	style,
	data,
	selected,
}) => {
	const sourceNode = useStore(
		useCallback((store) => store.nodeInternals.get(source), [source]),
	);
	const targetNode = useStore(
		useCallback((store) => store.nodeInternals.get(target), [target]),
	);

	if (!sourceNode || !targetNode) {
		return null;
	}

	let edgePath: string;
	let labelPoint: Point;
	if (source === target) {
		const samePathEdges = useStore((store) =>
			store.edges
				.filter(
					(edge) =>
						edge.hidden !== true &&
						edge.source === source &&
						edge.target === target &&
						source === target,
				)
				.map((edge) => edge.id),
		);
		const selfPath = createSmartSelfLoopPath(sourceNode, id, samePathEdges);
		edgePath = selfPath.path;
		labelPoint = selfPath.labelPoint;
	} else {
		const samePathEdges = useStore((store) =>
			store.edges
				.filter(
					(edge) =>
						edge.hidden !== true &&
						((edge.source === source && edge.target === target) ||
							(edge.source === target && edge.target === source)),
				)
				.map((edge) => edge.id),
		);
		const quadPath = createSmartQuadraticPath(
			sourceNode,
			targetNode,
			id,
			samePathEdges,
		);
		edgePath = quadPath.path;
		labelPoint = quadPath.labelPoint;
	}

	const hexToRGBA = (hex: string): string => {
		// Remove the leading '#' if present
		hex = hex.replace(/^#/, "");

		// If the hex code is in shorthand form (e.g., "#f53"), convert it to full form (e.g., "#ff5533")
		if (hex.length === 3) {
			hex = hex
				.split("")
				.map((char) => char + char)
				.join("");
		}

		// Parse the r, g, b values
		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);

		// Return the RGBA color with 50% transparency
		return `rgba(${r}, ${g}, ${b}, 0.5)`;
	};

	let color = STYLES.defaultEdgeColor;
	if (data !== undefined && data.backgroundColor !== undefined) {
		color = data.backgroundColor;
	}

	const markerId = `${id}__color=${color}&type=arrowclosed`;

	return (
		<>
			<defs>
				<marker
					className="react-flow__arrowhead"
					id={markerId}
					markerWidth="12.5"
					markerHeight="12.5"
					viewBox="-10 -10 20 20"
					markerUnits="strokeWidth"
					orient="auto-start-reverse"
					refX="0"
					refY="0"
				>
					<polyline
						style={{
							stroke: color,
							fill: color,
							strokeWidth: STYLES.edgeWidth,
						}}
						strokeLinecap="round"
						strokeLinejoin="round"
						points="-5,-4 0,0 -5,4 -5,-4"
					/>
				</marker>
			</defs>
			{selected && (
				<path
					id={`${id}-selected`}
					d={edgePath}
					style={{
						...style,
						strokeWidth: parseInt(STYLES.edgeWidth) + 5,
						stroke: hexToRGBA(color),
						fill: "transparent",
					}}
				/>
			)}
			<path
				id={id}
				className="react-flow__edge-path"
				d={edgePath}
				markerEnd={`url(#${markerId})`}
				style={{
					...style,
					strokeWidth: STYLES.edgeWidth,
					stroke: color,
				}}
			/>
			{data?.label !== undefined && (
				<EdgeLabelRenderer>
					<div
						style={{
							position: "absolute",
							transform: `translate(-50%, -50%) translate(${labelPoint.x}px,${labelPoint.y}px)`,
							fontSize: 12,
							// everything inside EdgeLabelRenderer has no pointer events by default
							// if you have an interactive element, set pointer-events: all
							pointerEvents: "all",
						}}
						className="nodrag nopan"
					>
						<div
							style={{
								height: "20px",
								minWidth: "20px",
								background: "#2e2e2ef0",
								padding: "0px 1px",
								// paddingTop: "4px",
								border: `2px solid ${color}`,
								cursor: "pointer",
								borderRadius: `${data.labelRadius || 50}%`,
								fontSize: "12px",
								lineHeight: "19px",
								textAlign: "center",
								color: "#eeeeee",
							}}
						>
							{data.label}
						</div>
					</div>
				</EdgeLabelRenderer>
			)}
		</>
	);
};

const BaseRelationship: IGCRelationshipProps & RegistryComponent =
	createComponent(
		RawBaseRelationship,
		"BaseRelationship",
		"Base Relationship",
		{
			color: STYLES.defaultEdgeColor,
			type: "relationship",
			settable: true,
		},
	);
export default BaseRelationship;

export const defaultEdgeOptions = {
	// style: { strokeWidth: STYLES.edgeWidth, stroke: STYLES.defaultEdgeColor },
	type: "floating",
	markerEnd: {
		type: MarkerType.ArrowClosed,
		color: STYLES.defaultEdgeColor,
	},
	elevateEdgesOnSelection: true,
};
