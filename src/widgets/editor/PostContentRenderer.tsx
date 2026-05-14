import sanitizeHtml from 'sanitize-html';
import './PostContentRenderer.css';

type PostContentRendererProps = {
    html: string;
};

const allowedTags = [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'h2',
    'h3',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'img',
    'code',
    'pre',
];

function toRenderableHtml(content: string) {
    const looksLikeHtml = /<[a-z][\s\S]*>/i.test(content);
    return looksLikeHtml ? content : content.replace(/\n/g, '<br>');
}

export default function PostContentRenderer({ html }: PostContentRendererProps) {
    const clean = sanitizeHtml(toRenderableHtml(html), {
        allowedTags,
        allowedAttributes: {
            a: ['href', 'title', 'target', 'rel'],
            img: ['src', 'alt', 'title'],
        },
        allowedSchemes: ['http', 'https'],
        allowedSchemesByTag: {
            img: ['http', 'https'],
        },
        allowProtocolRelative: false,
        allowedSchemesAppliedToAttributes: ['href', 'src'],
        transformTags: {
            a: sanitizeHtml.simpleTransform('a', {
                target: '_blank',
                rel: 'noreferrer',
            }),
        },
    });

    return <div className="post-content-rendered" dangerouslySetInnerHTML={{ __html: clean }} />;
}
