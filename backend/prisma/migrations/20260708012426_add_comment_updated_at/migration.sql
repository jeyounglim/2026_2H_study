-- AlterTable: 기존 댓글 row 가 있을 수 있으므로 createdAt 값으로 updatedAt 을 채운다.
ALTER TABLE `comments` ADD COLUMN `updatedAt` DATETIME(3) NULL;
UPDATE `comments` SET `updatedAt` = `createdAt`;
ALTER TABLE `comments` MODIFY COLUMN `updatedAt` DATETIME(3) NOT NULL;
