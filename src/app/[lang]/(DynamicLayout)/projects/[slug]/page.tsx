import {
	Flag, Guild, Media, Project,
} from '@/types/payload-types';
import DescriptionSerializer from '@/components/ui/project/util/DescriptionSerializer';
import TextHeader from '@/components/ui/old/TextHeader';
import PayloadResponse from '@/types/PayloadResponse';
import Submissions from '@/components/ui/project/Submissions';
import Gallery from '@/components/ui/project/Gallery';
import ExperimentalProjectPage from '@/components/ui/project/experimental/sana/Page';
import PhaserSubmissionWrapper from '@/components/ui/project/guratanabata/PhaserSubmissionWrapper';
import { notFound } from 'next/navigation';
import { getImageUrl } from '@/components/ui/old/Image';
import { Metadata } from 'next';
import useTranslation from '@/lib/i18n/server';
import { Language } from '@/lib/i18n/languages';
import PixiSubmissionWrapper from '@/components/ui/project/kroniipuzzle/PixiSubmissionWrapper';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';

// ID's for both production and development databases
// TODO: Replace with Payload data
const ID_TO_STYLE_MAP = new Map<string, string>();
ID_TO_STYLE_MAP.set('62c16ca2b919eb349a6b09ba', 'theme-ina');

// Development testing ID's
ID_TO_STYLE_MAP.set('62c9442ff1ee39aa37afc4c7', 'theme-ina');
ID_TO_STYLE_MAP.set('63209a0af2be5d1c9590fb62', 'theme-sana');

interface IProps {
	params: {
		slug: string;
		lang: Language;
	}
}

interface ProjectData {
	project: Omit<Project, 'flags' | 'devprops'> & {
		flags: string[];
		devprops: {
			[key: string]: string;
		};
	};
}

async function fetchProject(slug: string, lang: Language): Promise<ProjectData | null> {
	// Fetch locale for the page, CMS will fall back to EN for any fields not translated
	const projectRes = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL!}/api/projects?where[slug][like]=${slug}&depth=2&locale=${lang}&fallback-locale=en`, {
		headers: {
			'X-RateLimit-Bypass': process.env.PAYLOAD_BYPASS_RATE_LIMIT_KEY ?? undefined,
			Authorization: process.env.PAYLOAD_API_KEY ? `users API-Key ${process.env.PAYLOAD_API_KEY}` : undefined,
		} as Record<string, string>,
		next: {
			tags: [slug],
		},
	});

	const res = (await projectRes.json() as PayloadResponse<Project>);
	if (res.totalDocs === 0) return null;

	const project = res.docs[0];
	const flags = (project.flags as Flag[] | undefined ?? []).map((flag) => flag.code);

	return {
		project: {
			...project,
			media: project.media!.map((item) => {
				if (!item.media) return item;

				return {
					...item,
					media: {
						...item.media as Media,
						url: getImageUrl({ src: (item.media as Media).url!, width: 1024 }),
					} as Media,
				};
			}),
			flags,
			// eslint-disable-next-line max-len
			devprops: project.devprops ? project.devprops.reduce((a, v) => ({ ...a, [v.key]: v.value }), {}) : {},
		},
	};
}

// eslint-disable-next-line max-len
export default async function ProjectPage({ params: { slug, lang } }: IProps) {
	const res = await fetchProject(slug, lang);
	if (res === null) {
		notFound();
	}

	const { project } = res;

	// const ref = useMemo(() => createRef<BlurBackground>(), []);

	const themeStyle = ID_TO_STYLE_MAP.get((project.organizer as Guild).id);

	if (project.flags?.includes('experimental')) {
		return (
			<ExperimentalProjectPage project={project} />
		);
	}

	if (project.flags?.includes('guratanabata')) {
		return (
			<PhaserSubmissionWrapper project={project} />
		);
	}

	if (project.flags?.includes('kronii-puzzle')) {
		return (
			<PixiSubmissionWrapper project={project} />
		);
	}

	// eslint-disable-next-line react-hooks/rules-of-hooks
	const { t } = await useTranslation(lang, 'project', 'page');

	return (
		<div className={themeStyle}>
			<div className="flex h-full min-h-screen flex-col bg-skin-background text-skin-text dark:bg-skin-background-dark dark:text-skin-text-dark">
				<div className="grow">
					<div className="my-16 flex w-full flex-col items-center px-4 md:px-16 lg:px-24 2xl:px-56">
						<div className="w-full max-w-full break-words px-4 sm:!max-w-4xl md:break-normal">
							<div className="flex justify-between">
								<TextHeader>
									{t('description.left')}
									<span className="text-skin-heading dark:text-skin-heading-dark">
										{t('description.right')}
									</span>
								</TextHeader>
								<div className="flex flex-col text-right">
									<span className="font-semibold">
										Organized by:
										{' '}
										<span className="text-skin-heading dark:text-skin-heading-dark">
											{(project.organizer as Guild).name}
										</span>
									</span>
									<span>
										Released on:
										{' '}
										{
											(new Intl.DateTimeFormat('en-GB', {
												year: 'numeric',
												month: 'long',
												day: 'numeric',
											})
												.format(new Date(project.date)))
										}
									</span>
								</div>
							</div>
							<div className="description-body text-lg">
								{DescriptionSerializer(project.description)}
							</div>
							{(project.media?.length ?? 0) > 0 && (
								<Gallery project={project as any} />
							)}
							{(project.links?.length ?? 0) > 0 && (
								<div className="mt-4">
									<TextHeader>
										{t('links')}
									</TextHeader>
									<div className="flex justify-center space-x-6 px-4 sm:px-0">
										{project.links && project.links.map((link) => (
											<div
												key={`link-${link.name}-${link.url}`}
												className="mt-4 flex h-10 cursor-pointer content-end items-center justify-center gap-2 rounded-3xl bg-skin-primary px-4 font-bold text-white hover:underline dark:bg-skin-primary-dark"
											>
												<a href={link.url} target="_blank" rel="noreferrer">
													{link.name}
												</a>
												<ArrowTopRightOnSquareIcon className="h-6 w-6" />
											</div>
										))}
									</div>
								</div>
							)}
							{/* TODO: Move submissions to separate tab */}
							<div className="mt-4">
								{!(project.flags.includes('disableTabs') || project.flags.includes('filterableSubmissions')) && (
									<TextHeader>
										Community
										<span className="text-skin-heading dark:text-skin-heading-dark">
											{' '}
											Submissions
										</span>
									</TextHeader>
								)}
								<Submissions project={project} lang={lang} />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export async function generateStaticParams({ params: { lang } }: IProps) {
	let projects: Project[] = [];
	let moreProjects = true;
	let page = 1;

	async function fetchNextProjects() {
		// Fetch next page
		const projectsRes = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL!}/api/projects?depth=0&limit=100&page=${page}&depth=0&localelocale=${lang}&fallback-locale=en`, {
			headers: {
				'X-RateLimit-Bypass': process.env.PAYLOAD_BYPASS_RATE_LIMIT_KEY ?? undefined,
				Authorization: process.env.PAYLOAD_API_KEY ? `users API-Key ${process.env.PAYLOAD_API_KEY}` : undefined,
			} as Record<string, string>,
			next: {
				tags: ['projectList'],
			},
		});
		const body: PayloadResponse<Project> = await projectsRes.json();

		projects = projects.concat(body.docs);

		// Set variables for next fetch
		page += 1;
		moreProjects = body.hasNextPage;
	}

	while (moreProjects) {
		// eslint-disable-next-line no-await-in-loop
		await fetchNextProjects();
	}

	return projects.map((project) => (
		{
			slug: project.slug,
		}
	));
}

export async function generateMetadata({ params: { slug, lang } }: IProps): Promise<Metadata> {
	const projectRes = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL!}/api/projects?where[slug][like]=${slug}&depth=2&locale=${lang}&fallback-locale=en`, {
		headers: {
			'X-RateLimit-Bypass': process.env.PAYLOAD_BYPASS_RATE_LIMIT_KEY ?? undefined,
			Authorization: process.env.PAYLOAD_API_KEY ? `users API-Key ${process.env.PAYLOAD_API_KEY}` : undefined,
		} as Record<string, string>,
		next: {
			tags: [slug],
		},
	});
	const parsedProjectRes = (await projectRes.json() as PayloadResponse<Project>);
	if (parsedProjectRes.totalDocs === 0) return notFound();

	const {
		title, shortDescription, ogImage, image,
	} = parsedProjectRes.docs[0];

	return {
		title,
		description: shortDescription,
		alternates: {
			canonical: `/projects/${slug}`,
			languages: {
				en: `/en/projects/${slug}`,
				ja: `/jp/projects/${slug}`,
			},
		},
		openGraph: {
			title,
			description: shortDescription,
			siteName: 'HoloEN Fan Website',
			// eslint-disable-next-line max-len
			images: getImageUrl({ src: (ogImage as Media | undefined)?.url ?? (image as Media).url!, width: 1024 }),
		},
		twitter: {
			title,
			description: shortDescription,
			// eslint-disable-next-line max-len
			images: getImageUrl({ src: (ogImage as Media | undefined)?.url ?? (image as Media).url!, width: 1024 }),
			site: '@HEF_Website',
			card: 'summary_large_image',
		},
	};
}
