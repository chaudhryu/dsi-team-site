import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Technology } from "src/entities/technlogy.entity";
import { Repository } from "typeorm";

@Injectable()
export class TechnologiesService {
  constructor(
    @InjectRepository(Technology)
    private technologyRepository: Repository<Technology>
  ) {}

  findAll() {
    return this.technologyRepository.find();
  }
}
