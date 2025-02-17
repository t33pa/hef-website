'use client';

import {
	Container, Graphics, Text, useApp,
} from '@pixi/react';
import React, {
	useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import * as PIXI from 'pixi.js';
import { Graphics as PixiGraphics, Renderer, TextStyle } from 'pixi.js';
import type { Viewport as PixiViewport } from 'pixi-viewport';
import { Submission } from '@/types/payload-types';
import type { StageSize } from './PixiWrapper';
import Viewport from './pixi/Viewport';
import Sidebar from './pixi/Sidebar';
import Puzzle from './puzzle/Puzzle';
import ViewportContext from './providers/ViewportContext';
import PuzzleCompleteModal from './pixi/PuzzleCompleteModal';
import PieceDisplay from './pixi/PieceDisplay';
import PieceInfo from './puzzle/PieceInfo';
import {
	PUZZLE_WIDTH, SIDEBAR_WIDTH, WORLD_HEIGHT, WORLD_WIDTH,
} from './puzzle/PuzzleConfig';
import Button from './pixi/Button';
import Preview from './pixi/Preview';
import SettingsModal from './pixi/Settings';
import Cursor from './pixi/Cursor';
import AnimatedGIF from './pixi/AnimatedGIF';
import usePuzzleStore from './puzzle/PuzzleStore';
import PuzzleStartModal from './pixi/PuzzleStartModal';

interface IProps {
	stageSize: StageSize;
	submissions: Submission[];
	setShowAllSubmissions: (val: boolean) => void;
}

export default function PixiPuzzleContainer({
	stageSize, submissions, setShowAllSubmissions,
}: IProps) {
	const app = useApp();

	const [showPreview, setShowPreview] = useState(false);
	const [showExitModal, setShowExitModal] = useState(false);
	const [showSettingsModal, setShowSettingsModal] = useState(false);
	const [showPuzzleCompleteModal, setShowPuzzleCompleteModal] = useState(false);
	const [disableDragging, setDisableDragging] = useState(false);
	const [assetBundle, setAssetBundle] = useState<null | any>(null);
	const [selectedPiece, setSelectedPiece] = useState<PieceInfo | undefined>(undefined);

	const showPuzzleStartModal = usePuzzleStore((state) => state.firstLoad);
	const viewportRef = useRef<PixiViewport | null>(null);

	const viewportContextMemo = useMemo(
		() => (
			{
				disableDragging,
				setDisableDragging,
			}
		),
		[disableDragging],
	);

	useEffect(() => {
		(app.renderer as unknown as Renderer).framebuffer.blit();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		app.renderer.resize(stageSize.width, stageSize.height);
		viewportRef.current?.fit();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [stageSize]);

	useEffect(() => {
		PIXI.Assets.loadBundle('puzzle')
			.then((loadedBundle) => {
				setAssetBundle(loadedBundle);
			});
	}, []);

	const drawPuzzleContainer = useCallback((g: PixiGraphics) => {
		g.clear();
		g.beginFill(0x001E47);
		g.drawRect(SIDEBAR_WIDTH, 0, stageSize.width, stageSize.height);
		g.endFill();
		g.beginHole();
		// eslint-disable-next-line max-len
		g.drawRoundedRect(SIDEBAR_WIDTH, 16, stageSize.width - SIDEBAR_WIDTH - 16, stageSize.height - 32, 8);
		g.endHole();
	}, [stageSize]);

	const gifs = useMemo(() => {
		const sideKronii1Scale = 0.25;
		const sideKronii2Scale = 0.25;
		const sideKronii3Scale = 0.25;
		const sideKronii4Scale = 0.25;

		return {
			sideKronii1: {
				x: window.innerWidth - (377 * sideKronii1Scale),
				y: window.innerHeight - (768 * sideKronii1Scale),
				width: (377 * sideKronii1Scale),
				height: (768 * sideKronii1Scale),
			},
			sideKronii2: {
				x: SIDEBAR_WIDTH,
				y: window.innerHeight - (235 * sideKronii2Scale),
				width: (506 * sideKronii2Scale),
				height: (235 * sideKronii2Scale),
			},
			sideKronii3: {
				x: SIDEBAR_WIDTH + ((window.innerWidth - SIDEBAR_WIDTH) * 0.1),
				y: 0,
				width: (694 * sideKronii3Scale),
				height: (678 * sideKronii3Scale),
			},
			sideKronii4: {
				x: SIDEBAR_WIDTH + ((window.innerWidth - SIDEBAR_WIDTH) * 0.7),
				y: 0,
				width: (808 * sideKronii4Scale),
				height: (653 * sideKronii4Scale),
			},
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [window.innerWidth, window.innerHeight]);

	return (
		<ViewportContext.Provider value={viewportContextMemo}>
			<Viewport
				width={stageSize.width}
				height={stageSize.height}
				worldWidth={WORLD_WIDTH}
				worldHeight={WORLD_HEIGHT}
				disableDragging={disableDragging}
				app={app}
				ref={viewportRef}
			>
				<Puzzle
					x={SIDEBAR_WIDTH + PUZZLE_WIDTH / 2}
					y={(WORLD_HEIGHT / 2 + (PUZZLE_WIDTH * 1.2) / 4) - WORLD_WIDTH / 4}
					width={PUZZLE_WIDTH}
					height={PUZZLE_WIDTH / 2}
					puzzleFinished={() => setShowPuzzleCompleteModal(true)}
					onPieceSelected={(piece: PieceInfo) => {
						if (piece.id !== selectedPiece?.id) {
							setSelectedPiece(piece);
						}
					}}
					submissions={submissions}
				/>
			</Viewport>
			<Graphics
				draw={drawPuzzleContainer}
			/>
			<Sidebar
				width={SIDEBAR_WIDTH}
				height={stageSize.height}
				setShowPreview={setShowPreview}
				setShowExitModal={setShowExitModal}
				setShowSettingsModal={setShowSettingsModal}
			>
				<PieceDisplay
					x={16}
					y={stageSize.height * 0.15}
					width={SIDEBAR_WIDTH - 32}
					height={stageSize.height * 0.75 - 16}
					pieceInfo={selectedPiece}
				/>
			</Sidebar>

			{assetBundle && (
				<>
					<AnimatedGIF
						x={gifs.sideKronii1.x}
						y={gifs.sideKronii1.y}
						gif={assetBundle.sideKronii1}
						width={gifs.sideKronii1.width}
						height={gifs.sideKronii1.height}
						intermittance={144000}
					/>
					<AnimatedGIF
						x={gifs.sideKronii2.x}
						y={gifs.sideKronii2.y}
						gif={assetBundle.sideKronii2}
						width={gifs.sideKronii2.width}
						height={gifs.sideKronii2.height}
						intermittance={233000}
					/>
					<AnimatedGIF
						x={gifs.sideKronii3.x}
						y={gifs.sideKronii3.y}
						gif={assetBundle.sideKronii3}
						width={gifs.sideKronii3.width}
						height={gifs.sideKronii3.height}
						intermittance={377000}
					/>
					<AnimatedGIF
						x={gifs.sideKronii4.x}
						y={gifs.sideKronii4.y}
						gif={assetBundle.sideKronii4}
						width={gifs.sideKronii4.width}
						height={gifs.sideKronii4.height}
						intermittance={610000}
					/>
				</>
			)}

			{showPreview && (
				<Preview setShowPreview={setShowPreview} />
			)}

			{
				showExitModal && (
					<Container>
						<Graphics
							draw={(g: PixiGraphics) => {
								g.clear();
								g.beginFill(0x222222);
								g.drawRect(0, 0, stageSize.width, stageSize.height);
								g.endFill();
							}}
						/>
						<Text
							text="Are you sure you want to leave?"
							style={{
								fill: 'white',
								fontSize: 32,
								fontWeight: 'bold',
								align: 'center',
							} as TextStyle}
							x={stageSize.width / 2}
							y={stageSize.height / 2 - 50}
							anchor={[0.5, 0.5]}
							scale={1}
						/>
						<Button
							x={stageSize.width / 2 - 145}
							y={stageSize.height / 2}
							width={120}
							height={60}
							label="Exit"
							color={0xAA2222}
							radius={8}
							onClick={() => {
								window.location.href = '/projects';
							}}
						/>
						<Button
							x={stageSize.width / 2 + 25}
							y={stageSize.height / 2}
							width={120}
							height={60}
							label="Cancel"
							radius={8}
							onClick={() => setShowExitModal(false)}
						/>
					</Container>
				)
			}

			{showPuzzleStartModal && (
				<PuzzleStartModal
					width={stageSize.width}
					height={stageSize.height}
					closeModal={() => {
						usePuzzleStore.getState().setFirstLoad(false);
					}}
				/>
			)}

			{showPuzzleCompleteModal && (
				<PuzzleCompleteModal
					x={0}
					y={0}
					width={stageSize.width}
					height={stageSize.height}
					closeModal={() => setShowPuzzleCompleteModal(false)}
					openSettings={() => setShowSettingsModal(true)}
				/>
			)}

			{showSettingsModal && (
				<SettingsModal
					x={0}
					y={0}
					width={stageSize.width}
					height={stageSize.height}
					setShowSettingsModal={setShowSettingsModal}
					setShowAllSubmissions={setShowAllSubmissions}
				/>
			)}

			<Cursor />
		</ViewportContext.Provider>
	);
}
