---
title: "Por que dividir um canvas raster em tiles?"
description: "A relação entre regiões modificadas, tamanho de tiles e o custo potencial de atualizar um canvas."
date: "2026-11-28"
topic: "graphics"
areas: ["graphics", "performance"]
readingOrder: 1
draft: false
tags: ["Rasterization", "C++", "Metal", "Memory"]
language: "pt-BR"
---

Uma pincelada pode ocupar uma região pequena de um canvas, mesmo quando a imagem inteira tem milhares de pixels de largura. Se o armazenamento é dividido em blocos, essa região pode ser convertida em um conjunto de tiles candidatos a atualização.

## O tamanho do bloco

Em um canvas de 4096 × 4096 com quatro bytes por pixel, uma imagem densa ocupa 64 MiB, sem contar mipmaps, alinhamento ou cópias. Um tile de 256 × 256 ocupa 256 KiB nesse mesmo formato. Existem 256 tiles em uma divisão uniforme dessa imagem.

Uma região modificada que atravessa a fronteira entre quatro tiles pode exigir atualização dos quatro. Reduzir o tamanho do tile pode diminuir a área candidata ao trabalho, mas aumenta o número de blocos e os metadados necessários para gerenciá-los.

## A fronteira com a GPU

Os tiles de armazenamento de um aplicativo e os tiles internos de uma GPU são coisas diferentes. A renderização tile-based pode manter dados intermediários de um render pass em memória local do chip. Não existe uma correspondência automática entre os blocos escolhidos pelo aplicativo e essa organização do hardware.

Também não basta contar tiles para prever a latência do traço. A transferência de dados, a composição das camadas, a sincronização e o momento da apresentação participam do custo total.

## Um modelo pequeno

O [Raster Playground](/lab/#raster) permite alterar a granularidade e mover uma região delimitadora. Ele mostra quantos blocos intersectam essa região. A contagem é um modelo de invalidação, não uma medição de tempo ou de tráfego real de memória.

Uma investigação de performance exigiria medir o trabalho da CPU e da GPU separadamente e comparar a mesma pincelada sob as mesmas condições.
