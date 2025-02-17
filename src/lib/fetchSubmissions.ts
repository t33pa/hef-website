import { Submission, SubmissionMedia } from '@/types/payload-types';
import PayloadResponse from '@/types/PayloadResponse';

interface MediaItem {
	type: 'image' | 'video';
	subtype?: 'artwork' | 'picture' | 'other';
	image?: SubmissionMedia;
	url?: string;
	id?: string;
}

interface ISubmission extends Submission {
	media?: MediaItem[];
}

export default async function fetchSubmissions(project: { id: string, slug: string }) {
	// Create an array for all the submissions
	let moreSubmissions = true;
	let page = 1;
	const submissions: ISubmission[] = [];

	async function fetchNextSubmissions() {
		// Fetch next page
		const submissionsRes = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL!}/api/submissions?where[project][equals]=${project.id}&limit=100&page=${page}&depth=0`, {
			headers: {
				'X-RateLimit-Bypass': process.env.PAYLOAD_BYPASS_RATE_LIMIT_KEY ?? undefined,
				Authorization: process.env.PAYLOAD_API_KEY ? `users API-Key ${process.env.PAYLOAD_API_KEY}` : undefined,
			} as Record<string, string>,
			next: {
				tags: [project.slug],
			},
		});
		const body: PayloadResponse<Submission> = await submissionsRes.json();

		// Process submissions
		const tasks = body.docs.map(async (submission) => {
			// Fetch media if needed
			if (submission.srcIcon) {
				const mediaFetch = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL!}/api/submission-media/${submission.srcIcon as string}`, {
					headers: {
						'X-RateLimit-Bypass': process.env.PAYLOAD_BYPASS_RATE_LIMIT_KEY ?? undefined,
						Authorization: process.env.PAYLOAD_API_KEY ? `users API-Key ${process.env.PAYLOAD_API_KEY}` : undefined,
					} as Record<string, string>,
					next: {
						tags: [project.slug],
					},
				});
				// eslint-disable-next-line no-param-reassign
				submission.srcIcon = await mediaFetch.json();
			}

			const mediaDocs: ISubmission['media'] = [];
			await Promise.all((submission.media ?? []).map(async (item, index) => {
				if (item.type !== 'image') {
					mediaDocs[index] = item as MediaItem;
					return;
				}

				const mediaFetch = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL!}/api/submission-media/${item.image as string}`, {
					headers: {
						'X-RateLimit-Bypass': process.env.PAYLOAD_BYPASS_RATE_LIMIT_KEY ?? undefined,
						Authorization: process.env.PAYLOAD_API_KEY ? `users API-Key ${process.env.PAYLOAD_API_KEY}` : undefined,
					} as Record<string, string>,
					next: {
						tags: [project.slug],
					},
				});
				mediaDocs[index] = {
					...item,
					image: await mediaFetch.json(),
				};
			}));

			// eslint-disable-next-line no-param-reassign
			submission.media = mediaDocs;
			submissions.push(submission as ISubmission);
		});
		await Promise.all(tasks);

		// Set variables for next fetch
		page += 1;
		moreSubmissions = body.hasNextPage;
	}

	while (moreSubmissions) {
		// eslint-disable-next-line no-await-in-loop
		await fetchNextSubmissions();
	}

	return submissions;
}
