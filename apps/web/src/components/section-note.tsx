type SectionNoteProps = Readonly<{
  children: string;
}>;

export function SectionNote({ children }: SectionNoteProps) {
  return <p className="section-note">{children}</p>;
}
