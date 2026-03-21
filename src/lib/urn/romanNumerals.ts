export type PixelCoords = Record<number, number[]>;

const LETTER_LENGTH: Record<string, number> = {
  I: 1,
  V: 7,
  X: 5,
  L: 4,
  C: 4,
  D: 5,
  M: 7,
};

const ROW_POSITIONS: Record<number, number[]> = {
  1: [8],
  2: [8, 17],
  3: [8, 17, 26],
  4: [8, 17, 26, 35],
  5: [8, 17, 26, 35, 53],
};

const MAX_ROW_LENGTH: Record<number, number> = {
  1: 17,
  2: 20,
  3: 30,
  4: 25,
  5: 14,
};

export const MAX_POSSIBLE_ASSETS = 4887;

const FULL_COORDS: PixelCoords = {
  21: [20, 21, 22, 23, 26, 29, 32, 38],
  22: [20, 26, 29, 32, 38],
  23: [20, 26, 29, 32, 38],
  24: [20, 21, 22, 26, 29, 32, 38],
  25: [20, 26, 29, 32, 38],
  26: [20, 26, 29, 32, 38],
  27: [20, 26, 27, 28, 29, 32, 33, 34, 35, 38, 39, 40, 41],
};

export function romanize(num: number): string {
  if (isNaN(num)) return "";
  const digits = String(+num).split("");
  const key = [
    "",
    "C",
    "CC",
    "CCC",
    "CD",
    "D",
    "DC",
    "DCC",
    "DCCC",
    "CM",
    "",
    "X",
    "XX",
    "XXX",
    "XL",
    "L",
    "LX",
    "LXX",
    "LXXX",
    "XC",
    "",
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
  ];
  let roman = "";
  let i = 3;
  while (i--) roman = (key[+(digits.pop() || 0) + i * 10] || "") + roman;
  return Array(+digits.join("") + 1).join("M") + roman;
}

export function getLetter(
  returnArray: PixelCoords,
  thisPosition: string,
  thisLetter: string,
): PixelCoords {
  const splitPosition = thisPosition.split("-");
  const row = parseInt(splitPosition[0]);
  const start = parseInt(splitPosition[1]);
  const addArray: PixelCoords = {};

  if (thisLetter === "I") {
    addArray[row - 3] = [start];
    addArray[row - 2] = [start];
    addArray[row - 1] = [start];
    addArray[row] = [start];
    addArray[row + 1] = [start];
    addArray[row + 2] = [start];
    addArray[row + 3] = [start];
  } else if (thisLetter === "V") {
    addArray[row - 3] = [start, start + 6];
    addArray[row - 2] = [start, start + 6];
    addArray[row - 1] = [start + 1, start + 5];
    addArray[row] = [start + 1, start + 5];
    addArray[row + 1] = [start + 2, start + 4];
    addArray[row + 2] = [start + 2, start + 4];
    addArray[row + 3] = [start + 3];
  } else if (thisLetter === "X") {
    addArray[row - 3] = [start, start + 4];
    addArray[row - 2] = [start, start + 4];
    addArray[row - 1] = [start + 1, start + 3];
    addArray[row] = [start + 2];
    addArray[row + 1] = [start + 1, start + 3];
    addArray[row + 2] = [start, start + 4];
    addArray[row + 3] = [start, start + 4];
  } else if (thisLetter === "L") {
    addArray[row - 3] = [start];
    addArray[row - 2] = [start];
    addArray[row - 1] = [start];
    addArray[row] = [start];
    addArray[row + 1] = [start];
    addArray[row + 2] = [start];
    addArray[row + 3] = [start, start + 1, start + 2, start + 3];
  } else if (thisLetter === "C") {
    addArray[row - 3] = [start, start + 1, start + 2, start + 3];
    addArray[row - 2] = [start, start + 3];
    addArray[row - 1] = [start];
    addArray[row] = [start];
    addArray[row + 1] = [start];
    addArray[row + 2] = [start, start + 3];
    addArray[row + 3] = [start, start + 1, start + 2, start + 3];
  } else if (thisLetter === "D") {
    addArray[row - 3] = [start, start + 1, start + 2, start + 3];
    addArray[row - 2] = [start + 1, start + 4];
    addArray[row - 1] = [start + 1, start + 4];
    addArray[row] = [start + 1, start + 4];
    addArray[row + 1] = [start + 1, start + 4];
    addArray[row + 2] = [start + 1, start + 4];
    addArray[row + 3] = [start, start + 1, start + 2, start + 3];
  } else if (thisLetter === "M") {
    addArray[row - 3] = [start, start + 1, start + 5, start + 6];
    addArray[row - 2] = [start, start + 2, start + 4, start + 6];
    addArray[row - 1] = [start, start + 2, start + 4, start + 6];
    addArray[row] = [start, start + 2, start + 4, start + 6];
    addArray[row + 1] = [start, start + 3, start + 6];
    addArray[row + 2] = [start, start + 6];
    addArray[row + 3] = [start, start + 6];
  }

  for (const key in addArray) {
    if (returnArray[key]) {
      returnArray[key] = returnArray[key].concat(addArray[key]);
    } else {
      returnArray[key] = addArray[key];
    }
  }

  return returnArray;
}

export function computeRomanCoords(assetCount: number): PixelCoords {
  if (assetCount <= 0) return {};
  if (assetCount > MAX_POSSIBLE_ASSETS) return FULL_COORDS;

  const romanNumber = romanize(assetCount);
  let romanArray: PixelCoords = {};
  let totalRows = 1;
  let letterRows: number[] = [];
  const lengthPerRow: Record<number, number> = {};
  const iLetterInRow: Record<number, number> = {};
  const letterLengthPositions: number[] = [];
  let lengthCounter = 0;

  for (let i = 0; i < romanNumber.length; i++) {
    const thisMaxLength = MAX_ROW_LENGTH[totalRows];
    const thisLetter = romanNumber.charAt(i);
    const thisLength = LETTER_LENGTH[thisLetter];
    letterLengthPositions.push(thisLength);
    lengthCounter += thisLength;
    if (lengthPerRow[totalRows] > 0) {
      lengthCounter += 2;
    }
    if (lengthCounter > thisMaxLength) {
      totalRows++;
      letterRows = ROW_POSITIONS[totalRows];
      lengthCounter = thisLength;
    } else {
      letterRows = ROW_POSITIONS[totalRows];
    }

    if (lengthPerRow[totalRows] > 0) {
      lengthPerRow[totalRows] += 2;
      lengthPerRow[totalRows] += thisLength;
    } else {
      lengthPerRow[totalRows] = thisLength;
    }
    iLetterInRow[i] = totalRows;
  }

  const foundPositions = letterRows;
  let usePosition = "";
  let lastPosition = 0;
  const checkedRows: number[] = [];

  for (let i = 0; i < romanNumber.length; i++) {
    const whichRow = iLetterInRow[i];
    let skipLastPosCalc = false;
    if (!checkedRows.includes(whichRow)) {
      let startPoint = 30 - lengthPerRow[whichRow] / 2;
      startPoint = Math.round(startPoint);
      lastPosition = startPoint;
      checkedRows.push(whichRow);
      skipLastPosCalc = true;
    }
    const thisLetter = romanNumber.charAt(i);
    let thisPosition = 0;
    try {
      thisPosition = foundPositions[whichRow - 1];
    } catch {
      continue;
    }
    if (i === 0) {
      usePosition = thisPosition + "-" + lastPosition;
    } else {
      if (!skipLastPosCalc) {
        lastPosition = lastPosition + letterLengthPositions[i - 1] + 2;
      }
      usePosition = thisPosition + "-" + lastPosition;
    }
    romanArray = getLetter(romanArray, usePosition, thisLetter);
  }

  return romanArray;
}
