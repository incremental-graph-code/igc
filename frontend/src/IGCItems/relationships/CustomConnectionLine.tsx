import { ConnectionLineComponent, getStraightPath } from "reactflow";
import { STYLES } from "@/styles/constants";
import { Node } from "reactflow";
import { Point, Rectangle } from "@/types/frontend";
import {
	calculatePerpendicularOffsetPoint,
	getBezierNodeIntersection,
	getNodeIntersectionWithCircle,
} from "../utils/utils";

export const getSimpleStraightPath = (
	sourceX: number,
	sourceY: number,
	targetX: number,
	targetY: number,
): string => {
	const [path] = getStraightPath({
		sourceX: sourceX,
		sourceY: sourceY,
		targetX: targetX,
		targetY: targetY,
	});
	return path;
};

// Calculate the offset for the edge based on the id in the idList
const calculateOffset = (
	id: string,
	idList: string[],
	offsetGap: number,
): number => {
	const idIndex = idList.indexOf(id);

	if (idIndex === -1) {
		throw new Error(`Id "${id}" not found in the idList`);
	}

	const totalIds = idList.length;
	const halfRange = (totalIds - 1) / 2;

	const offset = (idIndex - halfRange) * offsetGap;

	return offset;
};

// Create a quadratic path based on the source and target nodes where the offset is calculated based on the id in the idList
export const createSmartQuadraticPath = (
	sourceNode: Node,
	targetNode: Node,
	edgeId: string,
	idList: string[],
	offsetGap = 50,
) => {
    const sNode = Rectangle.fromNode(sourceNode);
    const tNode = Rectangle.fromNode(targetNode);

    if (sNode === null || tNode === null) {
        return {path: "", labelPoint: Point.ZERO}
    }
	let offset = calculateOffset(edgeId, idList, offsetGap);
	if (sourceNode.id > targetNode.id) {
		offset = -offset;
	}
	return createQuadraticPath(sNode, tNode, offset);
};

// Create a quadratic bezier path based on the source and target nodes with a given offset
const createQuadraticPath = (
	sourceNode: Rectangle,
	targetNode: Rectangle,
	offset: number,
): { path: string; labelPoint: Point } => {
	const sourceCenter: Point = sourceNode.center();
	const targetCenter: Point = targetNode.center();

	const offsetPoint = calculatePerpendicularOffsetPoint(
		sourceCenter,
		targetCenter,
		offset * 1,
	);
	const labelPoint = calculatePerpendicularOffsetPoint(
		sourceCenter,
		targetCenter,
		offset,
	);

	// Calculate the control point
	const controlPoint: Point = {
		x: 2 * offsetPoint.x - 0.5 * (sourceCenter.x + targetCenter.x),
		y: 2 * offsetPoint.y - 0.5 * (sourceCenter.y + targetCenter.y),
	};

	const sourceIntersection = getBezierNodeIntersection(
		sourceNode,
		sourceCenter,
		controlPoint,
		targetCenter,
	);
	const targetIntersection = getBezierNodeIntersection(
		targetNode,
		sourceCenter,
		controlPoint,
		targetCenter,
	);

    // If intersections were not found, fallback to original points
	const finalSource = sourceIntersection || sourceCenter;
	const finalTarget = targetIntersection || targetCenter;

	// Calculate the adjusted control point
	const adjustedControlPoint: Point = {
		x:
			2 * offsetPoint.x -
			0.5 * (finalSource.x + finalTarget.x),
		y:
			2 * offsetPoint.y -
			0.5 * (finalSource.y + finalTarget.y),
	};

	// Create the quadratic Bezier path command
	return {
		path: `M ${finalSource.x},${finalSource.y} Q ${adjustedControlPoint.x},${adjustedControlPoint.y} ${finalTarget.x},${finalTarget.y}`,
		labelPoint: labelPoint,
	};
};

// Create a self-loop path based on the node and the id in the idList
export const createSmartSelfLoopPath = (
	node: Node,
	edgeId: string,
	idList: string[],
	offsetGap = 20,
	startOffset = 30,
) => {
    const rect = Rectangle.fromNode(node);
    if (rect === null) {
        return {path: "", labelPoint: Point.ZERO}
    }
	const radius = startOffset + offsetGap * idList.indexOf(edgeId);
	return createSelfLoopPath(rect, radius);
};

// Create a self-loop path based on the node and the radius
const createSelfLoopPath = (nodeRect: Rectangle, r: number) => {
	const nodeCenter = nodeRect.center();

	// Calculate circle center
	const circleCenter = { x: nodeCenter.x, y: nodeCenter.y + r };

	// Calculate label point
	const labelPoint = { x: nodeCenter.x, y: nodeCenter.y + 2 * r };

	// Calculate the intersection points of the node bounds and the circle
	const intersections = getNodeIntersectionWithCircle(nodeRect, circleCenter, r);

	if (intersections.length < 2) {
		console.error("Not enough intersection points found");
		return { path: "", labelPoint: { x: 0, y: 0 } };
	}

    // Create the arc path command
    const path = `M ${intersections[0].x},${intersections[0].y} A ${r},${r} 0 1,0 ${intersections[1].x},${intersections[1].y}`;
    return {
		path,
		labelPoint,
	};
};

const CustomConnectionLine: ConnectionLineComponent = ({
	fromX,
	fromY,
	toX,
	toY,
	connectionLineStyle,
}) => {
	return (
		<g>
			<path
				style={connectionLineStyle}
				fill="none"
				d={getSimpleStraightPath(fromX, fromY, toX, toY)}
			/>
			<circle
				cx={toX}
				cy={toY}
				fill={STYLES.defaultEdgeColor}
				r={3}
				stroke={STYLES.defaultEdgeColor}
				strokeWidth={1.5}
			/>
		</g>
	);
};

export default CustomConnectionLine;

export const connectionLineStyle = {
	strokeWidth: STYLES.edgeWidth,
	stroke: STYLES.defaultEdgeColor,
};
