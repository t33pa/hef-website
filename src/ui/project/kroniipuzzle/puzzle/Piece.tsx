'use client';

import { useContext, useState } from 'react';
import { Container, Sprite, Text } from '@pixi/react';
import {
	FederatedPointerEvent, Sprite as PixiSprite, TextStyle, Texture,
} from 'pixi.js';
import ViewportContext from '../providers/ViewportContext';
import Message from './Message';
import PieceInfo from './PieceInfo';

interface PieceProps {
	c: number;
	r: number;
	numCols: number;
	numRows: number;
	pieceSize: number;
	texture: Texture;
	incrementCountAndCheckPuzzleFinished: () => void;
	setSelectedPiece: (piece: PieceInfo) => void;
	message?: Message;
	kronie?: PixiSprite;
}

// eslint-disable-next-line react/function-component-definition
const Piece: React.FC<PieceProps> = ({
	c,
	r,
	numCols,
	numRows,
	pieceSize,
	texture,
	incrementCountAndCheckPuzzleFinished,
	setSelectedPiece,
	message,
	kronie,
}) => {
	function getInitialPosX(): number {
		return Math.floor(Math.random() * pieceSize * numCols);
	}

	function getInitialPosY(): number {
		return Math.floor(Math.random() * pieceSize * numRows);
	}

	function extrapolatePos(index: number): number {
		return index * pieceSize;
	}

	const [dragging, setDragging] = useState(false);
	const [currentPosition, setCurrentPosition] = useState({
		x: getInitialPosX(),
		y: getInitialPosY(),
	});
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [targetPosition, setTargetPosition] = useState({
		x: extrapolatePos(c),
		y: extrapolatePos(r),
	});
	const [lastUpdatedAt, setLastUpatedAt] = useState(Date.now());
	const [parent, setParent] = useState(null as any);
	const { setDisableDragging } = useContext(ViewportContext);
	const [settled, setSettled] = useState(false);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [isRead, setIsRead] = useState(false);

	function isNearTargetPosition(x: number, y: number): boolean {
		// todo: check this logic. probably too contrived to work consistently for all resolutions
		const deltaX = Math.abs(x - targetPosition.x);
		const deltaY = Math.abs(y - targetPosition.y);
		return deltaX < 100 && deltaY < 100;
	}

	const handleDragStart = (event: FederatedPointerEvent) => {
		setSelectedPiece({
			message,
			sprite: kronie,
		} as PieceInfo);

		if (dragging || settled) {
			return;
		}

		const tempParent = event.target?.parent;
		if (tempParent != null) {
			setParent(tempParent);
		}
		setDragging(true);
		setDisableDragging(true);
		const now = Date.now();
		setLastUpatedAt(now);
	};

	const handleDragMove = (event: FederatedPointerEvent) => {
		if (!dragging) {
			return;
		}

		const { x, y } = event.getLocalPosition(parent);
		// todo: get position accounting for drag start position
		setCurrentPosition({ x: x - pieceSize / 2, y: y - pieceSize / 2 });
	};

	const handleDragEnd = (event: FederatedPointerEvent) => {
		if (!dragging) {
			return;
		}

		const { x, y } = event.getLocalPosition(parent);

		if (isNearTargetPosition(x, y)) {
			setSettled(true);
			setCurrentPosition({ x: targetPosition.x, y: targetPosition.y });
			setLastUpatedAt(0);
			incrementCountAndCheckPuzzleFinished();
		} else {
			// todo: get position accounting for drag start position
			setCurrentPosition({ x: x - pieceSize / 2, y: y - pieceSize / 2 });
		}

		setDragging(false);
		setDisableDragging(false);
	};

	return (
		<Container
			x={currentPosition.x ?? c * pieceSize}
			y={currentPosition.y ?? r * pieceSize}
			eventMode="static"
			onpointerdown={handleDragStart}
			onpointermove={handleDragMove}
			onglobalpointermove={handleDragMove}
			onpointerup={handleDragEnd}
			onpointerupoutside={handleDragEnd}
			touchstart={handleDragEnd}
			touchmove={handleDragEnd}
			touchend={handleDragEnd}
			touchendoutside={handleDragEnd}
			zIndex={lastUpdatedAt}
		>

			<Sprite
				texture={texture}
				x={-pieceSize / 2}
				y={-pieceSize / 2}
				width={pieceSize * 2}
				height={pieceSize * 2}
			/>
			<Text
				text={`${c}, ${r}`}
				style={{
					fill: 'white',
					fontSize: 25,
				} as TextStyle}
				x={pieceSize / 4}
				y={pieceSize / 4}
				scale={0.2}
			/>

		</Container>
	);
};

export default Piece;
