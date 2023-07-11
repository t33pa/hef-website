'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { useContext, useState } from 'react';
import {
	Container, Graphics, Sprite, Text,
} from '@pixi/react';
import {
	FederatedPointerEvent, Rectangle, TextStyle, Texture,
} from 'pixi.js';
import ViewportContext from '../providers/ViewportContext';

interface PieceProps {
	c: number;
	r: number;
	numCols: number;
	numRows: number;
	pieceSize: number;
	texture: Texture;
}

// eslint-disable-next-line react/function-component-definition
const Piece: React.FC<PieceProps> = ({
	c, r, numCols, numRows, pieceSize, texture,
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
	const [targetPosition, setTargetPosition] = useState({
		x: extrapolatePos(c),
		y: extrapolatePos(r),
	});
	const [lastUpdatedAt, setLastUpatedAt] = useState(Date.now());
	const [parent, setParent] = useState(null as any);
	const { setDisableDragging } = useContext(ViewportContext);
	const [settled, setSettled] = useState(false);

	function isNearTargetPosition(x: number, y: number): boolean {
		// todo: check this logic. probably too contrived to work consistently for all resolutions
		const xx = Math.abs(x - targetPosition.x);
		const yy = Math.abs(y - targetPosition.y);
		return xx < 10 && yy < 10;
	}

	const handleDragStart = (event: FederatedPointerEvent) => {
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
		setCurrentPosition({ x, y });
	};

	const handleDragEnd = (event: FederatedPointerEvent) => {
		if (!dragging) {
			return;
		}

		setDragging(false);
		setDisableDragging(false);

		const { x, y } = event.getLocalPosition(parent);

		if (isNearTargetPosition(x, y)) {
			setSettled(true);
			setCurrentPosition({ x: targetPosition.x, y: targetPosition.y });
			setLastUpatedAt(0);
		} else {
			setCurrentPosition({ x, y });
		}
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
				texture={new Texture(
					texture.baseTexture,
					new Rectangle(
						c * (texture.width / numCols),
						r * (texture.height / numRows),
						texture.width / numCols,
						texture.height / numRows,
					),
				)}
				x={0}
				y={0}
				width={pieceSize}
				height={pieceSize}
			/>
			<Text
				text={`${c}, ${r}`}
				style={{
					fill: 'white',
					fontSize: 25,
				} as TextStyle}
				x={0}
				y={0}
				scale={0.2}
			/>
			<Graphics
				width={pieceSize}
				height={pieceSize}
				draw={(g) => {
					g.lineStyle(0.2, 0xffffff);
					g.drawRect(
						0,
						0,
						pieceSize,
						pieceSize,
					);
				}}
			/>
		</Container>
	);
};

export default Piece;
