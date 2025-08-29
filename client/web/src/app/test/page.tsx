export default function Page() {
  class Example {
    a: number;
    b: number;
    c: number;
    private d;

    constructor() {
      this.a = 1;
      this.b = 2; // no "private" at runtime
      this.c = 3;
      this.d = 5;
    }
    printAll() {
      console.log(this.a + this.b + this.c, this.d);
    }
  }

  const ex = new Example();

  console.log("PRINTED HERE", ex.printAll());

  return <>{ex.b}</>;
}
