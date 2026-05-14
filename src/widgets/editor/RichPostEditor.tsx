import { useCallback, useEffect, useReducer, useRef, type ChangeEvent } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { uploadInlineImage } from '../../shared/api/postImage';
import './RichPostEditor.css';

type RichPostEditorProps = {
    initialContent?: string;
    onChange: (html: string) => void;
    placeholder?: string;
};

export default function RichPostEditor({
    initialContent = '',
    onChange,
    placeholder = '내용을 입력하세요.',
}: RichPostEditorProps) {
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const editorRef = useRef<Editor | null>(null);

    const insertImageFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드할 수 있습니다.');
            return;
        }

        try {
            const imageUrl = await uploadInlineImage(file);
            editorRef.current?.chain().focus().setImage({ src: imageUrl, alt: file.name }).run();
        } catch (error) {
            console.error('인라인 이미지 업로드 실패:', error);
            alert('이미지 업로드 중 오류가 발생했습니다.');
        }
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Image.configure({
                inline: false,
                allowBase64: false,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    target: '_blank',
                    rel: 'noreferrer',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: initialContent,
        editorProps: {
            handlePaste(_view, event) {
                const items = event.clipboardData?.items;
                if (!items) return false;

                for (const item of Array.from(items)) {
                    if (item.type.startsWith('image/')) {
                        const file = item.getAsFile();
                        if (!file) return false;

                        event.preventDefault();
                        void insertImageFile(file);
                        return true;
                    }
                }

                return false;
            },
            handleDrop(_view, event) {
                const file = Array.from(event.dataTransfer?.files ?? []).find((item) =>
                    item.type.startsWith('image/')
                );
                if (!file) return false;

                event.preventDefault();
                void insertImageFile(file);
                return true;
            },
        },
        onTransaction() { forceUpdate(); },
        onSelectionUpdate() { forceUpdate(); },
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        editorRef.current = editor;
    }, [editor]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        files.forEach((file) => {
            void insertImageFile(file);
        });
        event.target.value = '';
    };

    if (!editor) return null;

    return (
        <div className="rich-post-editor">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleFileChange}
            />

            <div className="rich-editor-toolbar">
                <button type="button" onClick={() => fileInputRef.current?.click()}>
                    사진
                </button>
                <button
                    type="button"
                    className={editor.isActive('bold') ? 'active' : ''}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    B
                </button>
                <button
                    type="button"
                    className={editor.isActive('italic') ? 'active' : ''}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    I
                </button>
                <button
                    type="button"
                    className={editor.isActive('underline') ? 'active' : ''}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                    U
                </button>
                <button
                    type="button"
                    className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                    H2
                </button>
                <button
                    type="button"
                    className={editor.isActive('heading', { level: 3 }) ? 'active' : ''}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                >
                    H3
                </button>
                <button
                    type="button"
                    className={editor.isActive('bulletList') ? 'active' : ''}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    목록
                </button>
                <button
                    type="button"
                    className={editor.isActive('orderedList') ? 'active' : ''}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    번호
                </button>
                <button
                    type="button"
                    className={editor.isActive('blockquote') ? 'active' : ''}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                >
                    인용
                </button>
                <button type="button" onClick={() => editor.chain().focus().undo().run()}>
                    되돌리기
                </button>
                <button type="button" onClick={() => editor.chain().focus().redo().run()}>
                    다시
                </button>
            </div>

            <EditorContent editor={editor} className="rich-editor-content" />
        </div>
    );
}
