import { describe, expect, it } from "bun:test";
import { decode, encode } from ".";

describe("encode", () => {
  it("should handle numbers", () => {
    const actual = encode({ foo: 10 });
    const expected = new FormData();
    expected.append("foo", "10");
    expect(actual).toEqual(expected);
  });

  it("should handle booleans", () => {
    const actual = encode({ foo: false, bar: true });
    const expected = new FormData();
    expected.append("foo", "false");
    expected.append("bar", "true");
    expect(actual).toEqual(expected);
  });

  it("should handle blobs", () => {
    const blob = new Blob(["foo"]);
    const actual = encode({ foo: blob });
    const expected = new FormData();
    expected.append("foo", blob);
    expect(actual).toEqual(expected);
  });

  it("should handle files", () => {
    const file = new File(["foo"], "foo.txt", {
      type: "text/plain",
    });
    const actual = encode({ foo: file });
    const expected = new FormData();
    expected.append("foo", file);
    expect(actual).toEqual(expected);
  });

  it("should handle arrays", () => {
    const actual = encode({ tags: ["foo", "bar", "baz"] });
    const expected = new FormData();
    expected.append("tags[0]", "foo");
    expected.append("tags[1]", "bar");
    expected.append("tags[2]", "baz");
    expect(actual).toEqual(expected);
  });

  it("should handle nested arrays", () => {
    const actual = encode({ foo: [["foo", "bar"], "baz"] });
    const expected = new FormData();
    expected.append("foo[0][0]", "foo");
    expected.append("foo[0][1]", "bar");
    expected.append("foo[1]", "baz");
    expect(actual).toEqual(expected);
  });

  it("should handle objects", () => {
    const actual = encode({ foo: { bar: { baz: "qux" } } });
    const expected = new FormData();
    expected.append("foo[bar][baz]", "qux");
    expect(actual).toEqual(expected);
  });

  it("should handle complex structures", () => {
    const actual = encode({ foo: { bar: [{ baz: ["qux"] }] } });
    const expected = new FormData();
    expected.append("foo[bar][0][baz][0]", "qux");
    expect(actual).toEqual(expected);
  });

  it("should ignore null and undefined", () => {
    const actual = encode({ foo: null, bar: undefined });
    const expected = new FormData();
    expect(actual).toEqual(expected);
  });
});

describe("decode", () => {
  it("should handle flat objects", () => {
    const formData = new FormData();
    formData.append("foo", "10");
    const actual = decode(formData);
    const expected = { foo: "10" };
    expect(actual).toEqual(expected);
  });

  it("should handle arrays", () => {
    const formData = new FormData();
    formData.append("tags[0]", "foo");
    formData.append("tags[1]", "bar");
    formData.append("tags[2]", "baz");
    const actual = decode(formData);
    const expected = { tags: ["foo", "bar", "baz"] };
    expect(actual).toEqual(expected);
  });

  it("should handle nested arrays", () => {
    const formData = new FormData();
    formData.append("foo[0][0]", "foo");
    formData.append("foo[0][1]", "bar");
    formData.append("foo[1]", "baz");
    const actual = decode(formData);
    const expected = { foo: [["foo", "bar"], "baz"] };
    expect(actual).toEqual(expected);
  });

  it("should handle objects", () => {
    const formData = new FormData();
    formData.append("foo[bar][baz]", "qux");
    const actual = decode(formData);
    const expected = { foo: { bar: { baz: "qux" } } };
    expect(actual).toEqual(expected);
  });

  it("should handle complex structures", () => {
    const formData = new FormData();
    formData.append("foo[bar][0][baz][0]", "qux");
    const actual = decode(formData);
    const expected = { foo: { bar: [{ baz: ["qux"] }] } };
    expect(actual).toEqual(expected);
  });

  it("should handle empty strings based on options", () => {
    const formData = new FormData();
    formData.append("foo", "");

    const preserve = decode(formData, { emptyString: "preserve" });
    expect(preserve).toEqual({ foo: "" });

    const setNull = decode(formData, { emptyString: "set null" });
    expect(setNull).toEqual({ foo: null });

    const setUndefined = decode(formData, { emptyString: "set undefined" });
    expect(setUndefined).toEqual({});
  });

  it("should handle multiple entries with the same key", () => {
    const formData = new FormData();
    formData.append("tags[0]", "foo");
    formData.append("tags[1]", "bar");
    formData.append("tags[2]", "baz");
    const actual = decode(formData);
    const expected = { tags: ["foo", "bar", "baz"] };
    expect(actual).toEqual(expected);
  });

  it("should ignore non-matching keys", () => {
    const formData = new FormData();
    formData.append("foo[bar][baz]", "qux");
    formData.append("foo[bar]", "shouldBeIgnored");
    const actual = decode(formData);
    const expected = { foo: { bar: { baz: "qux" } } };
    expect(actual).toEqual(expected);
  });

  it("should handle a mix of object and array keys", () => {
    const formData = new FormData();
    formData.append("foo[0][bar][baz]", "qux");
    formData.append("foo[1]", "value");
    const actual = decode(formData);
    const expected = { foo: [{ bar: { baz: "qux" } }, "value"] };
    expect(actual).toEqual(expected);
  });
});
