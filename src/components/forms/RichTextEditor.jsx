import React, { useEffect, useMemo } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  Box,
  FormHelperText,
  IconButton,
  Stack,
  Typography
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import "./RichTextEditor.css";

const RichTextEditor = ({
  value = "",
  onChange,
  onBlur,
  error,
  helperText,
  label,
  placeholder = "Enter description...",
  disabled = false,
  minHeight = 200
}) => {
  const extensions = useMemo(
    () => [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true
      }),
      Placeholder.configure({ placeholder })
    ],
    [placeholder]
  );

  const editor = useEditor({
    extensions,
    content: value || "",
    editable: !disabled,
    onUpdate: ({ editor: instance }) => {
      const html = instance.getHTML();
      if (onChange) onChange(html);
    },
    onBlur: () => {
      if (onBlur) onBlur();
    }
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current && !editor.isFocused) {
      editor.commands.setContent(value || "", false);
    }
  }, [editor, value]);

  const handleLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("Enter URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <Box sx={{ width: "100%" }}>
      {label && (
        <Typography
          variant="body2"
          sx={{
            mb: 1,
            fontWeight: 500,
            color: error ? "error.main" : "text.primary"
          }}
        >
          {label}
        </Typography>
      )}
      <Box
        className="rich-text-editor"
        sx={{
          border: (theme) =>
            `1px solid ${
              error
                ? theme.palette.error.main
                : alpha(theme.palette.divider, 0.5)
            }`,
          borderRadius: 1,
          overflow: "hidden",
          backgroundColor: disabled
            ? "action.disabledBackground"
            : "transparent",
          "&:hover": {
            borderColor: error ? "error.main" : "primary.main"
          },
          "&:focus-within": {
            borderColor: error ? "error.main" : "primary.main",
            borderWidth: 2
          }
        }}
      >
        <Stack
          direction="row"
          spacing={0.5}
          className="rich-text-editor__toolbar"
          sx={{
            px: 1,
            py: 0.5,
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            backgroundColor: (theme) =>
              theme.palette.mode === "dark"
                ? alpha(theme.palette.background.paper, 0.8)
                : alpha(theme.palette.grey[50], 0.8)
          }}
        >
          <IconButton
            size="small"
            onClick={() => editor && editor.chain().focus().toggleBold().run()}
            disabled={!editor || !editor.can().chain().focus().toggleBold().run()}
            className={editor?.isActive("bold") ? "is-active" : undefined}
          >
            <FormatBoldIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() =>
              editor && editor.chain().focus().toggleItalic().run()
            }
            disabled={!editor || !editor.can().chain().focus().toggleItalic().run()}
            className={editor?.isActive("italic") ? "is-active" : undefined}
          >
            <FormatItalicIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() =>
              editor && editor.chain().focus().toggleStrike().run()
            }
            disabled={!editor || !editor.can().chain().focus().toggleStrike().run()}
            className={editor?.isActive("strike") ? "is-active" : undefined}
          >
            <FormatStrikethroughIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() =>
              editor && editor.chain().focus().toggleBulletList().run()
            }
            className={
              editor?.isActive("bulletList") ? "is-active" : undefined
            }
          >
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() =>
              editor && editor.chain().focus().toggleOrderedList().run()
            }
            className={
              editor?.isActive("orderedList") ? "is-active" : undefined
            }
          >
            <FormatListNumberedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleLink}
            className={editor?.isActive("link") ? "is-active" : undefined}
          >
            <LinkIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => editor && editor.chain().focus().unsetLink().run()}
            disabled={!editor || !editor.isActive("link")}
          >
            <LinkOffIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => editor && editor.chain().focus().undo().run()}
            disabled={!editor || !editor.can().chain().focus().undo().run()}
          >
            <UndoIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => editor && editor.chain().focus().redo().run()}
            disabled={!editor || !editor.can().chain().focus().redo().run()}
          >
            <RedoIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Box sx={{ px: 1.5, py: 1 }}>
          <EditorContent
            editor={editor}
            className="rich-text-editor__content"
            style={{ minHeight }}
          />
        </Box>
      </Box>
      {helperText && (
        <FormHelperText error={error} sx={{ mx: 1.75, mt: 0.5 }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};

export default RichTextEditor;
