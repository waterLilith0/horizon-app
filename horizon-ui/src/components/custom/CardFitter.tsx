function CardFitter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-center w-full">
      {children}
    </div>
  );
}

export default CardFitter;
