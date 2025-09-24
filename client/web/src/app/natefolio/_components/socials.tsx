import Section from "./section";

export default function Socials() {
  return (
    <>
      {" "}
      <Section>
        <div className="h-20 grid w-full grid-cols-2 gap-4">
          <div className="flex border-r p-4 justify-start items-center">
            LinkedIn placeholder
          </div>
          <div className="flex border-l p-4 justify-start items-center">
            Github placeholder
          </div>
        </div>
      </Section>
      <Section>
        <div className="h-4 flex gap-4">
          <div className="flex-1 border-r"></div>
          <div className="flex-1 border-l"></div>
        </div>
      </Section>
      <Section>
        <div className="h-20 grid w-full grid-cols-2 gap-4">
          <div className="flex border-r p-4 justify-start items-center">
            X placeholder
          </div>
          <div className="flex border-l p-4 justify-start items-center">
            Daily.dev placeholder
          </div>
        </div>
      </Section>
      <Section>
        <div className="h-4 flex gap-4">
          <div className="flex-1 border-r"></div>
          <div className="flex-1 border-l"></div>
        </div>
      </Section>
      <Section>
        <div className="h-20 grid w-full grid-cols-2 gap-4">
          <div className="flex border-r p-4 justify-start items-center">
            Zalo placeholder
          </div>
          <div className="flex border-l p-4 justify-start items-center">
            YT placeholder
          </div>
        </div>
      </Section>
    </>
  );
}
