import path from 'path';
import fse from 'fs-extra';
import glob from 'fast-glob';
import { gzipSizeSync } from 'gzip-size';

export const N_A = 'N/A';

// fast-glob only accepts posix path
// https://github.com/mrmlnc/fast-glob#convertpathtopatternpath
function convertPath(path: string) {
  if (process.platform === 'win32') {
    return glob.convertPathToPattern(path);
  }
  return path;
}

function formatFileSize(len: number) {
  const val = len / 1000;
  return val.toFixed(val < 1 ? 2 : 1);
}

/**
 * Get the total size of files in the target directory
 */
export async function getFileSizes(targetDir: string) {
  let files = await glob(convertPath(path.join(targetDir, '**/*')));
  let outputSize = 0;
  let gzippedSize = 0;

  files = files.filter((file) => {
    return !(
      file.endsWith('.map') ||
      file.endsWith('.LICENSE.txt') ||
      file.endsWith('.json')
    );
  });

  await Promise.all(
    files.map((file) =>
      fse.readFile(file, 'utf-8').then((content) => {
        outputSize += Buffer.byteLength(content);
        gzippedSize += gzipSizeSync(content);
      }),
    ),
  );

  return {
    outputSize: formatFileSize(outputSize),
    gzippedSize: formatFileSize(gzippedSize),
  };
}

/**
 * Add ranking emojis to metrics
 * @param {string[]} data - The data used for ranking.
 * @param {string} [sort="ASC"] - ASC means smaller values are better, DESC means bigger values are better.
 */
export function addRankingEmojis(data: string[], sort = 'ASC') {
  const values = data.map((originalValue, index) => ({
    index,
    value:
      originalValue === N_A
        ? Number.MAX_SAFE_INTEGER
        : parseFloat(originalValue),
    originalValue,
  }));

  if (sort === 'ASC') {
    // smaller is better
    values.sort((a, b) => a.value - b.value);
  } else if (sort === 'DESC') {
    // bigger is better
    values.sort((a, b) => b.value - a.value);
  } else {
    throw new Error('The sort param should be ASC or DESC');
  }

  const emojis = ['🥇', '🥈', '🥉'];

  values.forEach((item, rank) => {
    const emoji = rank < 3 ? emojis[rank] : '';
    if (item.originalValue !== N_A) {
      data[item.index] = item.originalValue + emoji;
    }
  });
}

export function shuffleArray<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export async function sleep(timeout: number) {
  return new Promise<void>((res) => {
    setTimeout(res, timeout);
  });
}
