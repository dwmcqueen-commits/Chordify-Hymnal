export function PhoneShell({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`mx-auto flex min-h-dvh w-full flex-col bg-ink ${
        wide ? "max-w-3xl" : "max-w-[430px]"
      }`}
    >
      {children}
    </div>
  );
}
