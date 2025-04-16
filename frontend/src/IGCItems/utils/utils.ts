import { Position, isEdge, Edge, Connection, Node } from "reactflow";
import { Point, Rectangle, RegistryComponent } from "@/types/frontend";
import ExecutionRelationship from "../relationships/ExecutionRelationship";

// this helper function returns the intersection point
// of the line between the center of the intersectionNode and the target node
const getNodeIntersection = (intersectionNode: Node, targetNode: Node) => {
	// https://math.stackexchange.com/questions/1724792/an-algorithm-for-finding-the-intersection-point-between-a-center-of-vision-and-a
	if (
		intersectionNode.width == null ||
		intersectionNode.height == null ||
		intersectionNode.positionAbsolute == null ||
		intersectionNode.positionAbsolute.x == null ||
		intersectionNode.positionAbsolute.y == null
	) {
		console.error("Intersection Node is missing width, height, x or y");
		return { x: 0, y: 0 };
	}
	if (
		targetNode.width == null ||
		targetNode.height == null ||
		targetNode.positionAbsolute == null ||
		targetNode.positionAbsolute.x == null ||
		targetNode.positionAbsolute.y == null
	) {
		console.error("Target Node is missing width, height, x or y");
		return { x: 0, y: 0 };
	}
	const {
		width: intersectionNodeWidth,
		height: intersectionNodeHeight,
		positionAbsolute: intersectionNodePosition,
	} = intersectionNode;
	const targetPosition = targetNode.positionAbsolute;

	const w = intersectionNodeWidth / 2;
	const h = intersectionNodeHeight / 2;

	const x2 = intersectionNodePosition.x + w;
	const y2 = intersectionNodePosition.y + h;
	const x1 = targetPosition.x + targetNode.width / 2;
	const y1 = targetPosition.y + targetNode.height / 2;

	const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
	const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
	const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
	const xx3 = a * xx1;
	const yy3 = a * yy1;
	const x = w * (xx3 + yy3) + x2;
	const y = h * (-xx3 + yy3) + y2;

	return { x, y };
};

// returns the position (top,right,bottom or right) passed node compared to the intersection point
const getEdgePosition = (node: Node, intersectionPoint: Point) => {
	const n = { ...node.positionAbsolute, ...node };
	if (n.width == null || n.height == null || n.x == null || n.y == null) {
		console.error("Node is missing width, height, x or y");
		return Position.Top;
	}

	const nx = Math.round(n.x);
	const ny = Math.round(n.y);
	const px = Math.round(intersectionPoint.x);
	const py = Math.round(intersectionPoint.y);
	if (px <= nx + 1) {
		return Position.Left;
	}
	if (px >= nx + n.width - 1) {
		return Position.Right;
	}
	if (py <= ny + 1) {
		return Position.Top;
	}
	if (py >= n.y + n.height - 1) {
		return Position.Bottom;
	}

	return Position.Top;
};

// returns the parameters (sx, sy, tx, ty, sourcePos, targetPos) you need to create an edge
export const getEdgeParams = (source: Node, target: Node) => {
	const sourceIntersectionPoint = getNodeIntersection(source, target);
	const targetIntersectionPoint = getNodeIntersection(target, source);

	const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
	const targetPos = getEdgePosition(target, targetIntersectionPoint);

	return {
		sx: sourceIntersectionPoint.x,
		sy: sourceIntersectionPoint.y,
		tx: targetIntersectionPoint.x,
		ty: targetIntersectionPoint.y,
		sourcePos,
		targetPos,
	};
};

// Bezier curve functions
const calculateMidpoint = (p1: Point, p2: Point): Point => ({
	x: (p1.x + p2.x) / 2,
	y: (p1.y + p2.y) / 2,
});

export const calculatePerpendicularOffsetPoint = (
	p1: Point,
	p2: Point,
	offset: number,
): Point => {
	const midpoint = calculateMidpoint(p1, p2);
	const dx = p2.x - p1.x;
	const dy = p2.y - p1.y;

	// Normalize the vector (dx, dy)
	const length = Math.sqrt(dx * dx + dy * dy);
	const ux = dx / length;
	const uy = dy / length;

	// Perpendicular vector (ux, uy) -> (-uy, ux)
	const offsetX = -uy * offset;
	const offsetY = ux * offset;

	// Calculate the offset point on the perpendicular line
	return { x: midpoint.x + offsetX, y: midpoint.y + offsetY };
};

const bezierPoint = (p0: Point, p1: Point, p2: Point, t: number): Point => ({
	x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x,
	y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y,
});

const solveQuadratic = (a: number, b: number, c: number): number[] => {
	if (a === 0) {
		// Handle linear case
		if (b !== 0) {
			const t = -c / b;
			return t >= 0 && t <= 1 ? [t] : [];
		}
		return [];
	}
	const discriminant = b * b - 4 * a * c;
	if (discriminant < 0) return [];
	const sqrtDiscriminant = Math.sqrt(discriminant);
	return [
		(-b + sqrtDiscriminant) / (2 * a),
		(-b - sqrtDiscriminant) / (2 * a),
	].filter((t) => t >= 0 && t <= 1);
};

export const getBezierNodeIntersection = (
	node: Rectangle,
	p0: Point,
	p1: Point,
	p2: Point,
): Point | null => {
	const intersections: Point[] = [];

	// Check for intersections with the left and right sides
	const checkSideIntersection = (nodeX: number) => {
		const a = p0.x - 2 * p1.x + p2.x;
		const b = -2 * p0.x + 2 * p1.x;
		const c = p0.x - nodeX;

		solveQuadratic(a, b, c).forEach((t) => {
			const pt = bezierPoint(p0, p1, p2, t);
			if (pt.y >= node.top && pt.y <= node.bottom) intersections.push(pt);
		});
	};

	checkSideIntersection(node.left);
	checkSideIntersection(node.right);

	// Check for intersections with the top and bottom sides
	const checkTopBottomIntersection = (nodeY: number) => {
		const a = p0.y - 2 * p1.y + p2.y;
		const b = -2 * p0.y + 2 * p1.y;
		const c = p0.y - nodeY;

		solveQuadratic(a, b, c).forEach((t) => {
			const pt = bezierPoint(p0, p1, p2, t);
			if (pt.x >= node.left && pt.x <= node.right) intersections.push(pt);
		});
	};

	checkTopBottomIntersection(node.top);
	checkTopBottomIntersection(node.bottom);

	if (intersections.length > 0) {
		return intersections[0]; // Return the first valid intersection
	}
	return null;
};

export const getNodeIntersectionWithCircle = (
	node: Rectangle,
	circleCenter: Point,
	r: number,
): Point[] => {
	const intersections: Point[] = [];

	// Check each side of the node for intersection
	const sides = [
		{
			x1: node.left,
			y1: node.top,
			x2: node.right,
			y2: node.top,
		}, // Top
		{
			x1: node.left,
			y1: node.bottom,
			x2: node.right,
			y2: node.bottom,
		}, // Bottom
		{
			x1: node.left,
			y1: node.top,
			x2: node.left,
			y2: node.bottom,
		}, // Left
		{
			x1: node.right,
			y1: node.top,
			x2: node.right,
			y2: node.bottom,
		}, // Right
	];

	sides.forEach((side) => {
		const dx = side.x2 - side.x1;
		const dy = side.y2 - side.y1;
		const A = dx * dx + dy * dy;
		const B =
			2 *
			(dx * (side.x1 - circleCenter.x) + dy * (side.y1 - circleCenter.y));
		const C =
			(side.x1 - circleCenter.x) * (side.x1 - circleCenter.x) +
			(side.y1 - circleCenter.y) * (side.y1 - circleCenter.y) -
			r * r;
		const det = B * B - 4 * A * C;

		if (det >= 0) {
			const t1 = (-B + Math.sqrt(det)) / (2 * A);
			const t2 = (-B - Math.sqrt(det)) / (2 * A);
			const addIntersection = (t: number) => {
				if (0 <= t && t <= 1) {
					const ix = side.x1 + t * dx;
					const iy = side.y1 + t * dy;
					intersections.push({ x: ix, y: iy });
				}
			};
			addIntersection(t1);
			addIntersection(t2);
		}
	});
	// Ensure exactly 2 intersection points by removing duplicates or points that are too close
	intersections.sort((a, b) => a.x - b.x || a.y - b.y);
	for (let i = 1; i < intersections.length; i++) {
		const dist = Math.hypot(
			intersections[i].x - intersections[i - 1].x,
			intersections[i].y - intersections[i - 1].y,
		);
		if (dist < 1e-5) {
			intersections.splice(i, 1);
			i--;
		}
	}
	return intersections.slice(0, 2);
};

// Create a new Node id
export const getNodeId = (nodes: Node[]): string => {
	// Create an unused edge id
	let i = 0;
	let id = `${i}`;
	while (nodes.some((nodes) => nodes.id === id)) {
		i++;
		id = `${i}`;
	}
	return id;
};

// Create a new Edge id
export const getEdgeId = (
	source: string,
	target: string,
	edges: Edge[],
	prefix = "",
): string => {
	// Create an unused edge id
	let i = 0;
	let id = `${prefix}${i}-${source}>${target}`;
	while (edges.some((edge) => edge.id === id)) {
		i++;
		id = `${prefix}${i}-${source}>${target}`;
	}
	return id;
};
// Custom logic to handle the connection
export const addEdge = (
	edgeParams: Edge | Connection,
	edges: Edge[],
): Edge[] => {
	if (!edgeParams.source || !edgeParams.target) {
		return edges;
	}

	let edge: Edge;
	if (isEdge(edgeParams)) {
		edge = { ...edgeParams };
	} else {
		edge = {
			...edgeParams,
			id: getEdgeId(edgeParams.source, edgeParams.target, edges),
		} as Edge;
	}

	return edges.concat(edge);
};

// Logic for whenever an edge gets removed
// export const updateExecutionPathEdge = (
// 	id: string,
// 	edges: Edge[],
// 	session: SessionData,
// ): { edges: Edge[]; session: SessionData } => {
// 	// Remove execution from executionPath. Note this might cause inconsistencies when running everything at once...
// 	// If an execution relationship is removed, update the session data
// 	const edgeObject = edges.find((edge) => edge.id === id);
// 	if (
// 		edgeObject?.type !== "ExecutionRelationship" ||
// 		edgeObject.data === undefined ||
// 		edgeObject.data.label === undefined
// 	) {
// 		return { edges, session };
// 	}
// 	edgeObject.data.will_delete = true;
// 	const label: string = edgeObject.data.label;
// 	session.executionPath.splice(parseInt(label), 1);

// 	// Remove all execution relationship edges
// 	let filteredEdges = edges.filter(
// 		(edge) =>
// 			edge.type !== "ExecutionRelationship" ||
// 			edge.data.will_delete === true,
// 	);

// 	// Add execution relationship edges
// 	for (let i = 0; i < session.executionPath.length - 1; i++) {
// 		const source = session.executionPath[i];
// 		const target = session.executionPath[i + 1];
// 		filteredEdges.push({
// 			id: getEdgeId(source, target, filteredEdges),
// 			source,
// 			target,
// 			type: "ExecutionRelationship",
// 			data: { label: `${i + 1}` },
// 		});
// 	}

// 	return { edges: filteredEdges, session };
// };

// Refresh the execution path edges
export const updateExecutionPath = (
	executionPath: string[],
): Edge[] => {
    executionPath = ["start", ...executionPath];
    let filteredEdges: Edge[] = [];
	// Add execution relationship edges
	for (let i = 0; i < executionPath.length - 1; i++) {
		const source = executionPath[i];
		const target = executionPath[i + 1];
		filteredEdges.push({
			id: getEdgeId(source, target, filteredEdges, "execution-"),
			source,
			target,
			type: "ExecutionRelationship",
			data: { label: `${i + 1}` },
		});
	}

	return filteredEdges;
};

// Get all incoming edges to a node
export const getIncomingEdges = (nodeId: string, edges: Edge[]): Edge[] => {
	return edges.filter((edge) => edge.target === nodeId);
};

// Get all outgoing edges to a node
export const getOutgoingEdges = (nodeId: string, edges: Edge[]): Edge[] => {
	return edges.filter((edge) => edge.source === nodeId);
};

// Get all nodes that are directed at a specific node
export const getIncomingNodes = (
	nodeId: string,
	nodes: Node[],
	edges: Edge[],
	nodeTypeFilter: (n: Node) => boolean = (_) => true,
    edgeTypeFilter: (e: Edge) => boolean = (_) => true,
): Node[] => {
	const incomingEdges = getIncomingEdges(nodeId, edges).filter(edgeTypeFilter);
	const incomingNodeIds = incomingEdges.map((edge) => edge.source);
	return nodes.filter(
		(node) =>
			incomingNodeIds.includes(node.id) &&
			node.type !== undefined &&
			nodeTypeFilter(node),
	);
};

// Get all nodes that are out of a specific node
export const getOutgoingNodes = (
	nodeId: string,
	nodes: Node[],
	edges: Edge[],
    nodeTypeFilter: (n: Node) => boolean = (_) => true,
	edgeTypeFilter: (e: Edge) => boolean = (_) => true,
): Node[] => {
	const outgoingEdges = getOutgoingEdges(nodeId, edges).filter(edgeTypeFilter);
	const outgoingNodeIds = outgoingEdges.map((edge) => edge.target);
	return nodes.filter(
		(node) =>
			outgoingNodeIds.includes(node.id) &&
			node.type !== undefined &&
			nodeTypeFilter(node),
	);
};


export const isComponentOfType = (
    component: RegistryComponent,
    typeComponent: RegistryComponent,
): boolean => {
    const componentTypeHierarchy = component.typeHierarchy;
    const tcSymbol = typeComponent.typeSymbol;
    if (componentTypeHierarchy === undefined) {
        return false;
    }
    for (let i = 0; i < componentTypeHierarchy.length; i++) {
        if (componentTypeHierarchy[i] === tcSymbol) {
            return true;
        }
    }
    return false;
};